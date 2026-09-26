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

  await runGate(world);

  assert.deepEqual(world.requestedReviewers, [
    { number: 7, reviewers: ['copilot-pull-request-reviewer[bot]'] }
  ]);
  assert.match(world.postedComments[0].body, /AI code review has been requested/);
  assert.equal(readStoredState(world).aiReviewRequestedSha, HEAD_SHA);
});

test('an AI review already paid for is not paid for twice', async () => {
  const world = createWorld({ storedState: { aiReviewRequestedSha: HEAD_SHA } });

  await runGate(world);

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

test('dry-run mode changes nothing at all', async () => {
  const world = createWorld({ body: '### Describe your changes:\n\n\n' });

  await runGate(world, { dryRun: true });

  assert.deepEqual(world.addedLabels, []);
  assert.deepEqual(world.postedComments, []);
  assert.deepEqual(world.closed, []);
});

test('an exempt pull request is left alone entirely', async () => {
  const world = createWorld({ body: '', labels: ['pr:daveit'] });

  await runGate(world);

  assert.deepEqual(world.addedLabels, []);
  assert.deepEqual(world.postedComments, []);
});

function runGate(world, options = {}) {
  process.env.GATE_DRY_RUN = options.dryRun === true ? 'true' : 'false';
  delete process.env.GATE_TARGET_NUMBER;

  return run({
    github: world.github,
    context: {
      eventName: 'pull_request_target',
      repo: { owner: 'nasa', repo: 'openmct' },
      payload: { pull_request: { number: world.pullRequestNumber } }
    },
    core: { info() {}, debug() {}, warning() {} }
  });
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
    reopened: []
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
        listFiles: async () => buildFiles(scenario),
        list: async () => ({ data: [] }),
        requestReviewers: async ({ pull_number, reviewers, team_reviewers }) => {
          world.requestedReviewers.push(stripUndefined({ number: pull_number, reviewers, team_reviewers }));
        }
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
    state: 'OPEN',
    authorAssociation: scenario.authorAssociation ?? 'CONTRIBUTOR',
    headRefOid: HEAD_SHA,
    author: CONTRIBUTOR,
    milestone: null,
    labels: { nodes: (scenario.labels ?? []).map((name) => ({ name })) },
    closingIssuesReferences: { nodes: readLinkedIssues(scenario) },
    reviews: { nodes: scenario.reviews ?? [] },
    reviewThreads: { nodes: scenario.reviewThreads ?? [] }
  };
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
    state: 'open',
    user: CONTRIBUTOR,
    author_association: scenario.authorAssociation ?? 'CONTRIBUTOR',
    labels: (scenario.labels ?? []).map((name) => ({ name })),
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
