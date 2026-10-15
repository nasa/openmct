/**
 * Drives the whole approval script against a stand-in for the GitHub API.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { run } = require('./approveForkRuns');

const REPOSITORY_ROOT = path.resolve(__dirname, '../../..');
const HEAD_SHA = 'abc1234def';

test('a fork pull request changing only source has its held runs approved', async () => {
  const world = createWorld({ changedFiles: ['src/a.js', 'src/aSpec.js'] });

  await runFor(world);

  assert.deepEqual(world.approvedRunIds, [1, 2]);
  assert.deepEqual(world.postedComments, [], 'nothing to say');
});

test('a fork pull request changing a workflow is held, with a comment naming the file', async () => {
  const world = createWorld({ changedFiles: ['src/a.js', '.github/workflows/pr.yml'] });

  await runFor(world);

  assert.deepEqual(world.approvedRunIds, []);
  assert.equal(world.postedComments.length, 1);
  assert.match(world.postedComments[0], /waiting for a maintainer/);
  assert.match(world.postedComments[0], /`\.github\/workflows\/pr\.yml`/);
});

test('a refused approval is reported, not hidden', async () => {
  const world = createWorld({ changedFiles: ['src/a.js'], refuseApprovals: true });

  await runFor(world);

  assert.equal(world.postedComments.length, 1);
  assert.match(world.postedComments[0], /would not let it be approved automatically/);
});

test('a pull request from a branch in this repository is left alone', async () => {
  const world = createWorld({ changedFiles: ['src/a.js'], isFork: false });

  await runFor(world);

  assert.deepEqual(world.approvedRunIds, []);
  assert.deepEqual(world.postedComments, []);
});

test('with nothing held there is nothing to do', async () => {
  const world = createWorld({ changedFiles: ['.github/workflows/pr.yml'], heldRuns: [] });

  await runFor(world);

  assert.deepEqual(world.approvedRunIds, []);
  assert.deepEqual(world.postedComments, [], 'a pull request that is not held is not told it is');
});

test('once a later commit drops the sensitive change, the earlier comment is corrected', async () => {
  const world = createWorld({
    changedFiles: ['src/a.js'],
    existingComments: [{ id: 50, body: 'CI is waiting for a maintainer.\n\n<!-- fork-ci-approval -->' }]
  });

  await runFor(world);

  assert.deepEqual(world.approvedRunIds, [1, 2]);
  assert.equal(world.updatedComments.length, 1);
  assert.match(world.updatedComments[0], /approved automatically/);
});

test('the scheduled sweep only checks open pull requests whose latest commit is held', async () => {
  const world = createWorld({ changedFiles: ['src/a.js'] });

  await run({ github: world.github, context: sweepContext(), core: quietCore() });

  assert.deepEqual(world.checkedPullRequests, [7], 'not #8, whose held runs are for an older commit');
  assert.deepEqual(world.approvedRunIds, [1, 2]);
});

function runFor(world) {
  return run({ github: world.github, context: pullRequestContext(), core: quietCore() });
}

function pullRequestContext() {
  return { eventName: 'pull_request_target', repo: { owner: 'nasa', repo: 'openmct' }, payload: { pull_request: { number: 7 } } };
}

function sweepContext() {
  return { eventName: 'schedule', repo: { owner: 'nasa', repo: 'openmct' }, payload: {} };
}

function quietCore() {
  return { info() {}, warning() {} };
}

/**
 * A stand-in for the pieces of the GitHub API the script uses, which records what
 * the script asked it to change.
 */
function createWorld(scenario) {
  process.env.GITHUB_WORKSPACE = REPOSITORY_ROOT;

  const world = { approvedRunIds: [], postedComments: [], updatedComments: [], checkedPullRequests: [] };
  const heldRuns = scenario.heldRuns ?? [
    { id: 1, name: 'PR', conclusion: 'action_required', head_sha: HEAD_SHA },
    { id: 2, name: 'CodeQL', conclusion: 'action_required', head_sha: HEAD_SHA }
  ];
  const endpoints = {
    // Like the real API, runs asked for by commit only come back for that commit.
    listWorkflowRunsForRepo: async ({ head_sha }) =>
      [...heldRuns, { id: 9, name: 'Old', conclusion: 'action_required', head_sha: 'stale' }].filter(
        (workflowRun) => head_sha === undefined || workflowRun.head_sha === head_sha
      ),
    listFiles: async () => scenario.changedFiles.map((filename) => ({ filename })),
    listComments: async () => scenario.existingComments ?? [],
    list: async () => [
      { number: 7, head: { sha: HEAD_SHA } },
      { number: 8, head: { sha: 'newer-than-its-held-runs' } }
    ]
  };

  world.github = {
    paginate: async (endpoint, parameters) => endpoint(parameters),
    request: async (route, { run_id }) => {
      if (scenario.refuseApprovals === true) {
        throw new Error('Resource not accessible by integration');
      }

      world.approvedRunIds.push(run_id);
    },
    rest: {
      actions: { listWorkflowRunsForRepo: endpoints.listWorkflowRunsForRepo },
      pulls: {
        get: async ({ pull_number }) => {
          world.checkedPullRequests.push(pull_number);

          return { data: buildPullRequest(pull_number, scenario) };
        },
        listFiles: endpoints.listFiles,
        list: endpoints.list
      },
      issues: {
        listComments: endpoints.listComments,
        createComment: async ({ body }) => world.postedComments.push(body),
        updateComment: async ({ body }) => world.updatedComments.push(body)
      }
    }
  };

  return world;
}

function buildPullRequest(pullNumber, scenario) {
  return {
    number: pullNumber,
    changed_files: scenario.changedFiles.length,
    head: {
      sha: HEAD_SHA,
      repo: { full_name: scenario.isFork === false ? 'nasa/openmct' : 'contributor/openmct' }
    }
  };
}
