/**
 * Drives the whole gate against a stand-in for the GitHub API, so that the
 * wiring between the rules, the stored state and the actions is covered without
 * touching the network.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { run } = require('./evaluate');
const { renderMarker } = require('./stateMarker');
const { AI_REQUIRED_CHECK_NAMES, REQUIRED_CHECK_NAMES } = require('./config');

const HEAD_SHA = 'abc1234';
const GATE_BOT = { login: 'github-actions[bot]', type: 'Bot' };
// As the GraphQL API names it: without the "[bot]" suffix the REST API adds.
const AI_REVIEWER = { login: 'coderabbitai' };
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

  assert.match(comment, /⬜ Linked to an issue.*\n {2}- Add a line such as `Closes #1234`/);
  assert.match(comment, /⬜ \*\*Author Checklist\*\* completed\n {2}- Restore the checklist/);
  assert.match(comment, /closed automatically/);
  assert.equal(world.requestedReviewers.length, 0, 'nothing is paid for before the rules are met');
});

test('a compliant pull request waits for the checks, and says which', async () => {
  const world = createWorld({ checkConclusions: { lint: 'failure' } });

  await runGate(world);

  assert.deepEqual(
    world.addedLabels,
    [{ number: 7, label: 'gate:awaiting-ci' }],
    'the gate sets no type label or milestone'
  );
  assert.doesNotMatch(world.postedComments[0].body, /milestone|`type:`/i);
  assert.match(
    world.postedComments[0].body,
    /⬜ `lint` passes\n {2}- Open the failed check from the Checks tab/
  );
  assert.equal(world.requestedReviewers.length, 0);
});

test('a draft is not reviewed until it is ready', async () => {
  const world = createWorld({ isDraft: true });

  await runGate(world);

  assert.match(world.postedComments[0].body, /⬜ Marked ready for review\n {2}- This is a draft/);
  assert.equal(world.requestedReviewers.length, 0);
});

test('an unanswered AI comment holds the pull request back', async () => {
  const world = createWorld({
    storedState: {},
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
    storedState: {},
    reviewThreads: [
      aiThread({
        id: 'thread-1',
        isResolved: false,
        replies: [{ author: CONTRIBUTOR, body: 'Fixed in abc1234.', url: 'https://example.test/2' }]
      })
    ]
  });

  await runGate(world);

  assert.deepEqual(world.resolvedThreads, ['thread-1']);
  assert.deepEqual(world.requestedReviewers, [{ number: 7, team_reviewers: ['openmct-web'] }]);
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
  assert.equal(readStoredState(world).teamReviewRequested, true);
});

test('answered threads are left for the gate to resolve until CI has passed', async () => {
  const world = createWorld({
    storedState: {},
    checkConclusions: { lint: 'failure' },
    reviewThreads: [
      aiThread({
        id: 'thread-1',
        isResolved: false,
        replies: [{ author: CONTRIBUTOR, body: 'Fixed in abc1234.', url: 'https://example.test/2' }]
      })
    ]
  });

  await runGate(world);

  assert.deepEqual(world.resolvedThreads, []);
  assert.deepEqual(world.requestedReviewers, []);
});

test('the team is asked only once', async () => {
  const world = createWorld({
    storedState: { teamReviewRequested: true },
    reviewThreads: [
      aiThread({
        id: 'thread-1',
        isResolved: true,
        replies: [{ author: CONTRIBUTOR, body: 'Done.', url: 'https://example.test/2' }]
      })
    ]
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
  assert.equal(
    readStoredState(world).reminderPostedAt !== undefined,
    true,
    'so a second reminder is never sent'
  );
});

test('a pull request without the pilot label is left entirely alone', async () => {
  const world = createWorld({ body: '### Describe your changes:\n\n\n', notCandidate: true });

  await runGate(world);

  assert.deepEqual(world.addedLabels, []);
  assert.deepEqual(world.postedComments, []);
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

test('with green checks and no review comments to answer, the team is asked, and no one else', async () => {
  const world = createWorld({});

  await runGate(world);

  assert.deepEqual(
    world.requestedReviewers,
    [{ number: 7, team_reviewers: ['openmct-web'] }],
    'CodeRabbit and CodeQL review on their own, so the gate never requests them'
  );
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
});

test('until CodeRabbit approves, the team is not asked', async () => {
  const world = createWorld({ aiReviewState: null });

  await runGate(world);

  assert.deepEqual(world.requestedReviewers, []);
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:automated-review' });
  assert.match(world.postedComments[0].body, /⬜ CodeRabbit approves\n {2}- It approves once/);
});

test("CodeRabbit's failed checks start the clock like any other rule", async () => {
  const world = createWorld({ aiReviewState: 'CHANGES_REQUESTED' });

  await runGate(world);

  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:needs-compliance' });
  assert.match(world.postedComments[0].body, /⬜ CodeRabbit's pre-merge checks pass/);
  assert.notEqual(readStoredState(world).noncompliantSince, undefined);
  assert.deepEqual(world.requestedReviewers, []);
});

test("an outside contributor who leaves CodeRabbit's checks failing is closed in time", async () => {
  const world = createWorld({
    aiReviewState: 'CHANGES_REQUESTED',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, [7]);
});

test('a CodeQL finding nobody has answered holds a pull request back', async () => {
  const codeqlThread = {
    id: 'codeql-1',
    isResolved: true,
    path: 'src/a.js',
    line: 3,
    comments: {
      nodes: [
        {
          author: { login: 'github-advanced-security' },
          body: 'Incomplete sanitization.',
          url: 'https://example.test/c'
        }
      ]
    }
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

  const mention = world.postedComments.find((comment) =>
    comment.body.includes('@nasa/openmct-web')
  );

  assert.notEqual(mention, undefined, 'a person is still told');
  assert.match(mention.body, /could not be applied/);
  assert.deepEqual(world.addedLabels.at(-1), { number: 7, label: 'gate:team-review' });
});

test('a closed pull request reopens on /recheck once its rules are met, whatever CodeRabbit last said', async () => {
  const world = createWorld({
    state: 'CLOSED',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' },
    aiReviewState: 'CHANGES_REQUESTED'
  });

  await runGate(world, { recheck: true });

  assert.deepEqual(
    world.reopened,
    [7],
    'CodeRabbit does not review a closed pull request, so it looks again once reopened'
  );
});

test('/recheck leaves a closed pull request closed while something is still missing, and says how to reopen it', async () => {
  const world = createWorld({
    body: 'Closes #4321\n\n### Describe your changes:\n\nA change.\n',
    state: 'CLOSED',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world, { recheck: true });

  const comment = world.updatedComments[0].body;

  assert.deepEqual(world.reopened, []);
  assert.deepEqual(world.closed, [], 'it is not closed a second time');
  assert.equal(world.postedComments.length, 0, 'and gets no second closing comment');
  assert.match(comment, /comment `\/recheck` and it reopens/);
  assert.doesNotMatch(
    comment,
    /will be closed automatically/,
    'no deadline for something already closed'
  );
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

test("a contributor's comment carrying a forged marker is not mistaken for the gate's", async () => {
  const forged = renderMarker({ noncompliantSince: '2999-01-01T00:00:00.000Z' });
  const world = createWorld({
    body: '### Describe your changes:\n\n\n',
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' },
    contributorComments: [
      { id: 5, user: { login: 'contributor', type: 'User' }, body: `Hello ${forged}` }
    ]
  });

  await runGate(world);

  assert.deepEqual(world.closed, [7], 'the real, overdue clock is the one that counts');
  assert.equal(
    world.updatedComments.every((comment) => comment.id === 999),
    true,
    "the contributor's comment is never edited"
  );
});

test("text quoted from the description cannot plant a marker in the gate's comment", async () => {
  const forged = '<!-- openmct-gate {"noncompliantSince":"2999-01-01T00:00:00.000Z"} -->';
  const world = createWorld({
    body: `### Describe your changes:\n\nA change.\n\n### Author Checklist\n\n* [ ] Done ${forged}\n`,
    storedState: { noncompliantSince: '2020-01-01T00:00:00.000Z' }
  });

  await runGate(world);

  assert.deepEqual(world.closed, [7]);
  assert.doesNotMatch(
    world.updatedComments[0].body,
    /2999/,
    'nothing of the forged marker survives'
  );
});

test('an @-mention in quoted text is shown as code, so it notifies nobody', async () => {
  const world = createWorld({
    body: '### Describe your changes:\n\nA change.\n\n### Author Checklist\n\n* [ ] ping @nasa/openmct-web\n'
  });

  await runGate(world);

  assert.match(world.postedComments[0].body, /`ping @nasa\/openmct-web`/);
});

test('every check is shown as it stands, even while a contribution rule is outstanding', async () => {
  const world = createWorld({ body: COMPLIANT_BODY.replace('Closes #4321', '') });

  await runGate(world);

  const comment = world.postedComments[0].body;

  assert.match(comment, /⬜ Linked to an issue/);
  assert.match(
    comment,
    /✅ `lint` passes/,
    'CI that passed is ticked, though the rules are not met'
  );
  assert.match(comment, /⬜ The maintainers are asked to review/);
});

test("CodeRabbit's checks are ticked from its comment once every one has passed", async () => {
  const table = AI_REQUIRED_CHECK_NAMES.map(
    (name) => `| ${name} | ![Passed](https://example.test/passed.svg) | Fine. |`
  ).join('\n');
  const world = createWorld({
    aiReviewState: null,
    contributorComments: [
      { id: 300, user: { login: 'coderabbitai[bot]', type: 'Bot' }, body: table }
    ]
  });

  await runGate(world);

  const comment = world.postedComments[0].body;

  assert.match(comment, /✅ CodeRabbit's pre-merge checks pass/);
  assert.match(comment, /⬜ CodeRabbit approves/, 'it has not approved yet');
});

test('a sharded job is one line, naming the shard that failed', async () => {
  const world = createWorld({
    checkConclusions: { 'e2e-ci (shard 2/4)': 'failure', 'visual-a11y-ci (shard 1/2)': null }
  });

  await runGate(world);

  const comment = world.postedComments[0].body;

  assert.match(
    comment,
    /⬜ `e2e-ci` passes on every shard\n {2}- Failed: `e2e-ci \(shard 2\/4\)`\./
  );
  assert.match(comment, /⏳ `visual-a11y-ci` passes on every shard/);
  assert.match(comment, /✅ `lint` passes\n/);
  assert.doesNotMatch(comment, /shard 1\/4/);
});

test('a check CodeQL skips is waited for only while the required checks run', async () => {
  const running = createWorld({ checkConclusions: { lint: null } });
  const finished = createWorld({});

  await runGate(running);
  await runGate(finished);

  assert.match(running.postedComments[0].body, /⏳ `Analyze` passes, if it runs/);
  assert.match(finished.postedComments[0].body, /✅ `Analyze` passes, if it runs/);
});

test("only a maintainer's approval ticks the maintainer's approval", async () => {
  const approvedByMaintainer = createWorld({ approvals: ['MEMBER'] });
  const approvedByOutsider = createWorld({ approvals: ['CONTRIBUTOR'] });

  await runGate(approvedByMaintainer);
  await runGate(approvedByOutsider);

  assert.match(approvedByMaintainer.postedComments[0].body, /✅ A maintainer approves/);
  assert.match(approvedByOutsider.postedComments[0].body, /⏳ A maintainer approves/);
});

function runGate(world, options = {}) {
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
    payload: {
      issue: { number: world.pullRequestNumber, pull_request: {} },
      comment: { body: '/recheck' }
    }
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
        list: async () => ({ data: [] }),
        requestReviewers: async ({ pull_number, reviewers, team_reviewers }) => {
          world.requestedReviewers.push(
            stripUndefined({ number: pull_number, reviewers, team_reviewers })
          );

          // The real API returns success and silently drops what it will not accept.
          if (team_reviewers !== undefined && scenario.teamSilentlyDropped !== true) {
            world.teamsOnReviewList = team_reviewers;
          }
        },
        listRequestedReviewers: async () => ({
          data: {
            users: [],
            teams: world.teamsOnReviewList.map((slug) => ({ slug }))
          }
        })
      },
      checks: {
        listForRef: async () => buildCheckRuns(scenario)
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
    authorAssociation: scenario.authorAssociation ?? 'CONTRIBUTOR',
    headRefOid: HEAD_SHA,
    author: CONTRIBUTOR,
    labels: { nodes: readLabels(scenario).map((name) => ({ name })) },
    closingIssuesReferences: { nodes: readLinkedIssues(scenario) },
    latestOpinionatedReviews: { nodes: buildLatestReviews(scenario) },
    reviewThreads: { nodes: scenario.reviewThreads ?? [] }
  };
}

/** CodeRabbit has approved unless the scenario says otherwise; null means no verdict yet. */
function buildLatestReviews(scenario) {
  const aiReviewState = scenario.aiReviewState === undefined ? 'APPROVED' : scenario.aiReviewState;

  const approvals = (scenario.approvals ?? []).map((authorAssociation, index) => ({
    state: 'APPROVED',
    authorAssociation,
    author: { login: `reviewer-${index}` }
  }));

  if (aiReviewState === null) {
    return approvals;
  }

  return [{ state: aiReviewState, authorAssociation: 'NONE', author: AI_REVIEWER }, ...approvals];
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
  const contributorComments = scenario.contributorComments ?? [];

  if (scenario.storedState === undefined) {
    return contributorComments;
  }

  return [...contributorComments, ...buildGateComment(scenario)];
}

function buildGateComment(scenario) {
  return [
    { id: 999, user: GATE_BOT, body: `Previous feedback.\n\n${renderMarker(scenario.storedState)}` }
  ];
}

function buildCheckRuns(scenario) {
  const overrides = scenario.checkConclusions ?? {};

  // A conclusion of null is a check still running, so only an absent one defaults.
  return REQUIRED_CHECK_NAMES.map((name) => ({
    name,
    conclusion: Object.hasOwn(overrides, name) ? overrides[name] : 'success'
  }));
}

function aiThread({ id, isResolved, replies }) {
  const firstComment = {
    author: AI_REVIEWER,
    body: 'Consider extracting this.',
    url: 'https://example.test/1'
  };

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
