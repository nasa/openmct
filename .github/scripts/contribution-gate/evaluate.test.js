/**
 * Drives the whole gate against a stand-in for the GitHub API, so that the
 * wiring between the rules, the stored state and the actions is covered without
 * touching the network.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { run } = require('./evaluate');
const { renderMarker } = require('./stateMarker');
const { REQUIRED_CHECK_NAMES } = require('./config');

const HEAD_SHA = 'abc1234';
const AI_REVIEWER = { login: 'copilot-pull-request-reviewer[bot]' };
const CONTRIBUTOR = { login: 'contributor' };

const COMPLIANT_ISSUE = {
  number: 4321,
  body: [
    '### Summary',
    '',
    'Plots drift after zooming.',
    '',
    '### Expected vs Current Behavior',
    '',
    'They should stay anchored.',
    '',
    '### Steps to Reproduce',
    '',
    '1. Open a plot',
    '',
    '### Testing Instructions',
    '',
    'Zoom, and watch the axis.'
  ].join('\n'),
  labels: { nodes: [{ name: 'type:bug' }] },
  comments: { nodes: [] }
};

const COMPLIANT_BODY = [
  'Closes #4321',
  '',
  '### Describe your changes:',
  '',
  'Re-anchors the plot after a zoom.',
  '',
  '### Author Checklist',
  '',
  '* [x] Changes address the original issue',
  '* [x] Automated tests are included or updated with these changes'
].join('\n');

test('a non-compliant pull request is labelled and told what is missing', async () => {
  const world = createWorld({ body: '### Describe your changes:\n\n\n' });

  await runGate(world);

  assert.deepEqual(world.addedLabels, [{ number: 7, label: 'gate:needs-compliance' }]);
  assert.equal(world.postedComments.length, 1);

  const comment = world.postedComments[0].body;

  assert.match(comment, /What is needed next/);
  assert.match(comment, /Describe your changes/);
  assert.match(comment, /not linked to an issue/);
  assert.match(comment, /closed automatically/);
  assert.equal(world.requestedReviewers.length, 0, 'nothing is paid for before the rules are met');
});

test('a compliant pull request waits for the checks, and says which', async () => {
  const world = createWorld({ checkConclusions: { lint: 'failure' } });

  await runGate(world);

  assert.deepEqual(world.addedLabels, [
    { number: 7, label: 'type:bug' },
    { number: 7, label: 'no milestone' },
    { number: 7, label: 'gate:awaiting-ci' }
  ], 'the type label is copied from the issue and the milestone decision recorded');
  assert.match(world.postedComments[0].body, /These checks need to pass.*lint/);
  assert.equal(world.requestedReviewers.length, 0);
});

test('a draft is not reviewed until it is ready', async () => {
  const world = createWorld({ isDraft: true });

  await runGate(world);

  assert.match(world.postedComments[0].body, /This is a draft/);
  assert.equal(world.requestedReviewers.length, 0);
});

test('green checks buy exactly one AI review', async () => {
  const world = createWorld({});

  await runGate(world, { aiReview: true });

  assert.deepEqual(world.requestedReviewers, [
    { number: 7, reviewers: ['Copilot'] }
  ]);
  assert.match(world.postedComments[0].body, /AI code review has been requested/);
  assert.equal(readStoredState(world).aiReviewRequestedSha, HEAD_SHA);
});

test('an AI review already paid for is not paid for twice', async () => {
  const world = createWorld({ storedState: { aiReviewRequestedSha: HEAD_SHA } });

  await runGate(world, { aiReview: true });

  assert.deepEqual(world.requestedReviewers, [], 'the stored state records that we already asked');
});

test('an unanswered AI comment holds the pull request back', async () => {
  const world = createWorld({
    storedState: { aiReviewRequestedSha: HEAD_SHA },
    reviews: [{ author: AI_REVIEWER }],
    reviewThreads: [aiThread({ id: 'thread-1', isResolved: true, replies: [] })]
  });

  await runGate(world);

  assert.deepEqual(world.resolvedThreads, []);
  assert.deepEqual(world.requestedReviewers, [], 'the team is not asked yet');
  assert.match(world.updatedComments[0].body, /still needing a reply/);
  assert.match(world.updatedComments[0].body, /resolved, but no reply yet/);
});

test('replying is enough: the gate resolves the thread and asks the team', async () => {
  const world = createWorld({
    storedState: { aiReviewRequestedSha: HEAD_SHA },
    reviews: [{ author: AI_REVIEWER }],
    reviewThreads: [aiThread({ id: 'thread-1', isResolved: false, replies: [{ author: CONTRIBUTOR, body: 'Fixed in abc1234.', url: 'https://example.test/2' }] })]
  });

  await runGate(world);

  assert.deepEqual(world.resolvedThreads, ['thread-1']);
  assert.deepEqual(world.requestedReviewers, [{ number: 7, team_reviewers: ['openmct-maintainers'] }]);
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
  assert.equal(readStoredState(world).teamReviewRequested, true);
});

test('the team is asked only once', async () => {
  const world = createWorld({
    storedState: { aiReviewRequestedSha: HEAD_SHA, teamReviewRequested: true },
    reviews: [{ author: AI_REVIEWER }],
    reviewThreads: [aiThread({ id: 'thread-1', isResolved: true, replies: [{ author: CONTRIBUTOR, body: 'Done.', url: 'https://example.test/2' }] })]
  });

  await runGate(world);

  assert.deepEqual(world.requestedReviewers, []);
});

test('an outside contributor who has run out of time is closed, kindly', async () => {
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, [7]);
  assert.match(world.postedComments[0].body, /Closing this for now/);
  assert.match(world.postedComments[0].body, /reopen automatically/);
});

test('a team member in the same position is never closed', async () => {
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    authorAssociation: 'MEMBER',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, []);
  assert.doesNotMatch(world.updatedComments[0].body, /closed automatically/);
});

test('a reminder goes out once, two days before the deadline', async () => {
  const twoDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    storedState: { noncompliantSince: twoDaysAgo }
  });

  await runGate(world);

  assert.equal(world.postedComments.length, 1);
  assert.match(world.postedComments[0].body, /friendly reminder/);
  assert.equal(readStoredState(world).reminderPostedAt !== undefined, true, 'so a second reminder is never sent');
});

test('a pull request without the pilot label is left entirely alone', async () => {
  const world = createWorld({ body: '### Describe your changes:\n\n\n', notCandidate: true });

  await runGate(world);

  assert.deepEqual(world.addedLabels, []);
  assert.deepEqual(world.postedComments, []);
  assert.deepEqual(world.publishedChecks, [], 'not even the milestone check, which PR Cop owns for it');
  assert.deepEqual(world.closed, []);
});

test('an overdue pull request without the pilot label is never closed', async () => {
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    notCandidate: true,
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, []);
});

test('an exempt pull request is left alone entirely', async () => {
  const world = createWorld({ body: '', labels: ['pr:daveit'] });

  await runGate(world);

  assert.deepEqual(world.addedLabels, []);
  assert.deepEqual(world.postedComments, []);
});

test('with the AI review off, green checks go straight to the team', async () => {
  const world = createWorld({});

  await runGate(world);

  assert.deepEqual(world.requestedReviewers, [{ number: 7, team_reviewers: ['openmct-maintainers'] }], 'nobody pays for an AI review');
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
  assert.doesNotMatch(world.postedComments[0].body, /AI code review/);
});

test('a CodeQL finding nobody has answered still holds a pull request back with the AI review off', async () => {
  const codeqlThread = {
    id: 'codeql-1',
    isResolved: true,
    path: 'src/a.js',
    line: 3,
    comments: { nodes: [{ author: { login: 'github-advanced-security[bot]' }, body: 'Incomplete sanitization.', url: 'https://example.test/c' }] }
  };
  const world = createWorld({ reviewThreads: [codeqlThread] });

  await runGate(world);

  assert.deepEqual(world.requestedReviewers, [], 'the team is not asked yet');
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:automated-review' });
  assert.match(world.postedComments[0].body, /still needing a reply/);
});

test('a team request the API silently drops is replaced by a mention', async () => {
  const world = createWorld({ teamSilentlyDropped: true });

  await runGate(world);

  const mention = world.postedComments.find((comment) => comment.body.includes('@nasa/openmct-maintainers'));

  assert.notEqual(mention, undefined, 'a person is still told');
  assert.match(mention.body, /could not be applied/);
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
});

test('an AI review the API silently drops does not strand the pull request', async () => {
  const world = createWorld({ aiReviewerSilentlyDropped: true });

  await runGate(world, { aiReview: true });

  assert.equal(readStoredState(world).aiReviewRequestedSha, undefined, 'it is not recorded as requested');
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' }, 'it fails open to the team');
});

test('the milestone check passes once the rules are met, and not before', async () => {
  const compliant = createWorld({});
  const incomplete = createWorld({ body: '### Describe your changes:\n\n\n' });

  await runGate(compliant);
  await runGate(incomplete);

  assert.deepEqual(compliant.publishedChecks, [{ name: 'Check Milestone', conclusion: 'success' }]);
  assert.deepEqual(incomplete.publishedChecks, [{ name: 'Check Milestone', conclusion: 'failure' }]);
});

test('a pull request with a milestone already set passes the milestone check even when incomplete', async () => {
  const world = createWorld({ body: '### Describe your changes:\n\n\n', hasMilestone: true });

  await runGate(world);

  assert.deepEqual(world.publishedChecks, [{ name: 'Check Milestone', conclusion: 'success' }]);
});

test('a closed pull request reopens on /recheck once a fix pushed after closing is on its branch', async () => {
  const world = createWorld({
    state: 'CLOSED',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' },
    changedFiles: ['src/plugins/plot/Plot.js'],
    branchTipFiles: ['src/plugins/plot/Plot.js', 'src/plugins/plot/PlotSpec.js']
  });

  await runGate(world, { recheck: true });

  assert.deepEqual(world.reopened, [7], 'the test pushed after closing counts');
  assert.deepEqual(world.publishedChecks, [{ name: 'Check Milestone', conclusion: 'success' }]);
});

test('/recheck leaves a closed pull request closed while something is still missing, and says how to reopen it', async () => {
  const world = createWorld({
    state: 'CLOSED',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' },
    changedFiles: ['src/plugins/plot/Plot.js'],
    branchTipFiles: ['src/plugins/plot/Plot.js']
  });

  await runGate(world, { recheck: true });

  const comment = world.updatedComments[0].body;

  assert.deepEqual(world.reopened, []);
  assert.deepEqual(world.closed, [], 'it is not closed a second time');
  assert.equal(world.postedComments.length, 0, 'and gets no second closing comment');
  assert.match(comment, /comment `\/recheck` and it reopens/);
  assert.doesNotMatch(comment, /will be closed automatically/, 'no deadline for something already closed');
});

test('the comment left on a pull request as it is closed does not promise a deadline that has passed', async () => {
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, [7]);
  assert.doesNotMatch(world.updatedComments[0].body, /will be closed automatically/);
  assert.match(world.updatedComments[0].body, /This is closed/);
});

test("PR Cop's milestone check is never rewritten: the gate publishes its own beside it", async () => {
  const prCopJobCheck = {
    id: 111,
    name: 'Check Milestone',
    conclusion: 'failure',
    app: { slug: 'github-actions' },
    external_id: 'a-workflow-job-uuid'
  };
  const world = createWorld({ existingChecks: [prCopJobCheck] });

  await runGate(world);

  assert.deepEqual(world.publishedChecks, [{ name: 'Check Milestone', conclusion: 'success' }]);
});

test("the gate updates its own earlier milestone check rather than adding another", async () => {
  const gateCheck = {
    id: 222,
    name: 'Check Milestone',
    conclusion: 'failure',
    app: { slug: 'github-actions' },
    external_id: 'openmct-contribution-gate'
  };
  const world = createWorld({ existingChecks: [gateCheck] });

  await runGate(world);

  assert.deepEqual(world.publishedChecks, [{ updated: 222, conclusion: 'success' }]);
});

test("a milestone check the gate already published the same way is left untouched", async () => {
  const gateCheck = {
    id: 333,
    name: 'Check Milestone',
    conclusion: 'success',
    app: { slug: 'github-actions' },
    external_id: 'openmct-contribution-gate'
  };
  const world = createWorld({ existingChecks: [gateCheck] });

  await runGate(world);

  assert.deepEqual(world.publishedChecks, []);
});

function runGate(world, options = {}) {
  process.env.GATE_AI_REVIEW = options.aiReview === true ? 'true' : 'false';

  return run({
    github: world.github,
    context: options.recheck === true ? recheckContext(world) : pullRequestContext(world),
    core: { info() {}, debug() {}, warning() {} }
  });
}

function pullRequestContext(world) {
  return {
    eventName: 'pull_request_target',
    repo: { owner: 'nasa', repo: 'openmct' },
    payload: { pull_request: { number: world.pullRequestNumber } }
  };
}

function recheckContext(world) {
  return {
    eventName: 'issue_comment',
    repo: { owner: 'nasa', repo: 'openmct' },
    payload: { issue: { number: world.pullRequestNumber, pull_request: {} }, comment: { body: '/recheck' } }
  };
}

/**
 * A stand-in for the pieces of the GitHub API the gate uses, which records what
 * the gate asked it to change.
 */
function createWorld(scenario) {
  const world = {
    pullRequestNumber: 7,
    addedLabels: [],
    removedLabels: [],
    postedComments: [],
    updatedComments: [],
    requestedReviewers: [],
    resolvedThreads: [],
    closed: [],
    reopened: [],
    publishedChecks: [],
    usersOnReviewList: [],
    teamsOnReviewList: []
  };
  const stickyComments = buildStickyComments(scenario);
  const pullRequest = buildPullRequest(scenario, world.pullRequestNumber);

  world.github = {
    graphql: async (query, variables) => respondToGraphql({ query, variables, pullRequest, world }),
    paginate: async (endpoint, parameters) => endpoint(parameters),
    rest: {
      issues: {
        get: async () => ({ data: buildIssueResponse(scenario) }),
        listComments: async () => stickyComments,
        addLabels: async ({ issue_number, labels }) => {
          world.addedLabels.push({ number: issue_number, label: labels[0] });
        },
        removeLabel: async ({ issue_number, name }) => {
          world.removedLabels.push({ number: issue_number, label: name });
        },
        createComment: async ({ issue_number, body }) => {
          world.postedComments.push({ number: issue_number, body });
        },
        updateComment: async ({ comment_id, body }) => {
          world.updatedComments.push({ id: comment_id, body });
        },
        update: async ({ issue_number, state }) => {
          const record = state === 'closed' ? world.closed : world.reopened;

          record.push(issue_number);
        }
      },
      pulls: {
        // A closed pull request's files are frozen at the commit it was closed on.
        listFiles: async () => buildFiles(scenario),
        list: async () => ({ data: [] }),
        requestReviewers: async ({ pull_number, reviewers, team_reviewers }) => {
          world.requestedReviewers.push(stripUndefined({ number: pull_number, reviewers, team_reviewers }));

          // The real API returns success and silently drops what it will not accept.
          if (reviewers !== undefined && scenario.aiReviewerSilentlyDropped !== true) {
            world.usersOnReviewList = reviewers;
          }

          if (team_reviewers !== undefined && scenario.teamSilentlyDropped !== true) {
            world.teamsOnReviewList = team_reviewers;
          }
        },
        listRequestedReviewers: async () => ({
          data: {
            users: world.usersOnReviewList.map((login) => ({ login })),
            teams: world.teamsOnReviewList.map((slug) => ({ slug }))
          }
        })
      },
      repos: {
        compareCommitsWithBasehead: async () => ({
          data: {
            commits: [{ sha: 'branch-tip-sha' }],
            files: (scenario.branchTipFiles ?? []).map((filename) => ({ filename }))
          }
        })
      },
      checks: {
        // Asked for one check by name, it answers with the checks already published
        // under that name; asked for everything, with the CI results.
        listForRef: async ({ check_name }) =>
          check_name === undefined
            ? buildCheckRuns(scenario)
            : (scenario.existingChecks ?? []).filter((check) => check.name === check_name),
        create: async ({ name, conclusion }) => {
          world.publishedChecks.push({ name, conclusion });
        },
        update: async ({ check_run_id, conclusion }) => {
          world.publishedChecks.push({ updated: check_run_id, conclusion });
        }
      }
    }
  };

  return world;
}

function respondToGraphql({ query, variables, pullRequest, world }) {
  if (query.includes('resolveGateThread')) {
    world.resolvedThreads.push(variables.threadId);

    return { resolveReviewThread: { thread: { id: variables.threadId } } };
  }

  if (query.includes('issueReferences')) {
    return { repository: { issue: { timelineItems: { nodes: [] } } } };
  }

  return { repository: { pullRequest } };
}

function buildPullRequest(scenario, number) {
  return {
    number,
    body: scenario.body ?? COMPLIANT_BODY,
    isDraft: scenario.isDraft === true,
    state: scenario.state ?? 'OPEN',
    headRefName: 'fix-branch',
    baseRefName: 'master',
    headRepositoryOwner: { login: 'contributor' },
    authorAssociation: scenario.authorAssociation ?? 'CONTRIBUTOR',
    headRefOid: HEAD_SHA,
    author: CONTRIBUTOR,
    milestone: scenario.hasMilestone === true ? { number: 81 } : null,
    labels: { nodes: readLabels(scenario).map((name) => ({ name })) },
    closingIssuesReferences: { nodes: readLinkedIssues(scenario) },
    reviews: { nodes: scenario.reviews ?? [] },
    reviewThreads: { nodes: scenario.reviewThreads ?? [] }
  };
}

/** Every scenario is a pilot candidate unless it says otherwise. */
function readLabels(scenario) {
  const pilotLabels = scenario.notCandidate === true ? [] : ['new-workflow-candidate'];

  return [...pilotLabels, ...(scenario.labels ?? [])];
}

function readLinkedIssues(scenario) {
  if (scenario.body !== undefined && scenario.body.includes('Closes #4321') === false) {
    return [];
  }

  return [COMPLIANT_ISSUE];
}

function buildIssueResponse(scenario) {
  return {
    number: 7,
    body: scenario.body ?? COMPLIANT_BODY,
    state: (scenario.state ?? 'OPEN').toLowerCase(),
    user: CONTRIBUTOR,
    author_association: scenario.authorAssociation ?? 'CONTRIBUTOR',
    labels: readLabels(scenario).map((name) => ({ name })),
    pull_request: {}
  };
}

function buildStickyComments(scenario) {
  if (scenario.storedState === undefined) {
    return [];
  }

  return [{ id: 999, body: `Previous feedback.\n\n${renderMarker(scenario.storedState)}` }];
}

function buildFiles(scenario) {
  const filenames = scenario.changedFiles ?? ['src/plugins/plot/Plot.js', 'e2e/tests/plot.e2e.spec.js'];

  return filenames.map((filename) => ({ filename }));
}

function buildCheckRuns(scenario) {
  const overrides = scenario.checkConclusions ?? {};

  return REQUIRED_CHECK_NAMES.map((name) => ({ name, conclusion: overrides[name] ?? 'success' }));
}

function aiThread({ id, isResolved, replies }) {
  const firstComment = { author: AI_REVIEWER, body: 'Consider extracting this.', url: 'https://example.test/1' };

  return {
    id,
    isResolved,
    path: 'src/plugins/plot/Plot.js',
    line: 42,
    comments: { nodes: [firstComment, ...replies] }
  };
}

function readStoredState(world) {
  const lastComment = [...world.postedComments, ...world.updatedComments].at(-1);

  return require('./stateMarker').readMarker(lastComment.body);
}

function stripUndefined(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
