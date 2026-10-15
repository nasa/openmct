/**
 * Approves a fork pull request's held CI runs, unless the pull request changes a
 * file listed in CODEOWNERS.
 *
 * GitHub holds every workflow run from a fork until a maintainer approves it. Most
 * pull requests only change source and tests, which run with a read-only token
 * and no secrets, so holding them only delays contributors. A pull request that
 * changes a workflow, a dependency or build configuration still waits for a
 * person, and gets a comment saying why.
 *
 * This runs as master's copy, under pull_request_target. It reads the pull
 * request only through the API and never checks out or runs its code.
 */

const fs = require('node:fs');
const path = require('node:path');

const { DECISIONS, decideApproval } = require('./approvalDecision');
const { readOwnedPatterns } = require('./codeowners');

const STICKY_MARKER = '<!-- fork-ci-approval -->';
const HELD_CONCLUSION = 'action_required';
const CODEOWNERS_PATH = '.github/CODEOWNERS';

/** Entry point called by the workflow. */
async function run({ github, context, core }) {
  const approver = createApprover({ github, context, core });
  const pullNumbers = await findPullRequestsToCheck(approver, context);

  core.info(`Checking ${pullNumbers.length} pull request(s).`);

  for (const pullNumber of pullNumbers) {
    await checkSafely(approver, pullNumber);
  }
}

function createApprover({ github, context, core }) {
  const { owner, repo } = context.repo;

  return { github, core, owner, repo, ownedPatterns: readCodeowners(core) };
}

async function findPullRequestsToCheck(approver, context) {
  if (context.eventName === 'pull_request_target') {
    return [context.payload.pull_request.number];
  }

  const requestedNumber = Number.parseInt(context.payload.inputs?.pull_request ?? '', 10);

  if (Number.isNaN(requestedNumber) === false) {
    return [requestedNumber];
  }

  return findPullRequestsWithHeldRuns(approver);
}

/** One awkward pull request must not stop the others being checked. */
async function checkSafely(approver, pullNumber) {
  try {
    await checkPullRequest(approver, pullNumber);
  } catch (error) {
    approver.core.warning(`Could not check #${pullNumber}: ${error.message}`);
  }
}

async function checkPullRequest(approver, pullNumber) {
  const pullRequest = await fetchPullRequest(approver, pullNumber);

  if (isFromFork(approver, pullRequest) === false) {
    approver.core.info(`#${pullNumber} is not from a fork; GitHub does not hold its runs.`);

    return;
  }

  const heldRuns = await findHeldRuns(approver, pullRequest.head.sha);

  if (heldRuns.length === 0) {
    approver.core.info(`#${pullNumber} has no held runs at ${pullRequest.head.sha.slice(0, 7)}.`);

    return;
  }

  const changes = await fetchChanges(approver, pullRequest);
  const verdict = decideApproval(changes, approver.ownedPatterns);

  approver.core.info(`#${pullNumber}: ${verdict.decision}. ${verdict.reason}`);

  await act(approver, pullRequest, heldRuns, verdict);
}

async function act(approver, pullRequest, heldRuns, verdict) {
  if (verdict.decision === DECISIONS.hold) {
    await writeStickyComment(approver, pullRequest, renderHeldComment(verdict));

    return;
  }

  const refusals = await approveRuns(approver, heldRuns);

  if (refusals.length > 0) {
    await writeStickyComment(approver, pullRequest, renderRefusedComment(refusals));

    return;
  }

  await updateStickyCommentIfPresent(approver, pullRequest, renderApprovedComment(pullRequest));
}

/** @returns {Promise<string[]>} why any run could not be approved */
async function approveRuns(approver, heldRuns) {
  const refusals = [];

  for (const heldRun of heldRuns) {
    const refusal = await approveRun(approver, heldRun);

    if (refusal !== undefined) {
      refusals.push(refusal);
    }
  }

  return refusals;
}

async function approveRun(approver, heldRun) {
  try {
    await approver.github.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve', {
      owner: approver.owner,
      repo: approver.repo,
      run_id: heldRun.id
    });
    approver.core.info(`Approved "${heldRun.name}" (${heldRun.id}).`);

    return undefined;
  } catch (error) {
    approver.core.warning(`GitHub refused to approve "${heldRun.name}" (${heldRun.id}): ${error.message}`);

    return `"${heldRun.name}": ${error.message}`;
  }
}

async function fetchPullRequest(approver, pullNumber) {
  const { data } = await approver.github.rest.pulls.get({
    owner: approver.owner,
    repo: approver.repo,
    pull_number: pullNumber
  });

  return data;
}

/** A fork that has since been deleted reports no repository; it is still a fork. */
function isFromFork(approver, pullRequest) {
  return pullRequest.head.repo?.full_name !== `${approver.owner}/${approver.repo}`;
}

async function findHeldRuns(approver, headSha) {
  const runs = await approver.github.paginate(approver.github.rest.actions.listWorkflowRunsForRepo, {
    owner: approver.owner,
    repo: approver.repo,
    head_sha: headSha,
    per_page: 100
  });

  return runs.filter((workflowRun) => workflowRun.conclusion === HELD_CONCLUSION);
}

/**
 * Both ends of a rename count: moving a workflow out of .github/ changes what CI
 * runs just as much as editing it.
 */
async function fetchChanges(approver, pullRequest) {
  const files = await approver.github.paginate(approver.github.rest.pulls.listFiles, {
    owner: approver.owner,
    repo: approver.repo,
    pull_number: pullRequest.number,
    per_page: 100
  });
  const changedPaths = files.flatMap((file) => [file.filename, file.previous_filename]).filter(isDefined);

  return { changedPaths, isFileListComplete: files.length >= pullRequest.changed_files };
}

/** For the scheduled sweep: open fork pull requests whose latest commit has held runs. */
async function findPullRequestsWithHeldRuns(approver) {
  const heldRuns = await approver.github.paginate(approver.github.rest.actions.listWorkflowRunsForRepo, {
    owner: approver.owner,
    repo: approver.repo,
    status: HELD_CONCLUSION,
    per_page: 100
  });
  const heldShas = new Set(heldRuns.map((workflowRun) => workflowRun.head_sha));
  const openPullRequests = await approver.github.paginate(approver.github.rest.pulls.list, {
    owner: approver.owner,
    repo: approver.repo,
    state: 'open',
    per_page: 100
  });

  return openPullRequests.filter((pullRequest) => heldShas.has(pullRequest.head.sha)).map((pullRequest) => pullRequest.number);
}

/**
 * Read from master's checkout, never from the pull request: a pull request that
 * edits CODEOWNERS is itself a change to .github/, and is held.
 */
function readCodeowners(core) {
  const codeownersFile = path.join(process.env.GITHUB_WORKSPACE ?? '.', CODEOWNERS_PATH);

  if (fs.existsSync(codeownersFile) === false) {
    core.warning(`${CODEOWNERS_PATH} is missing, so nothing will be approved automatically.`);

    return [];
  }

  return readOwnedPatterns(fs.readFileSync(codeownersFile, 'utf8'));
}

async function writeStickyComment(approver, pullRequest, body) {
  const existingComment = await findStickyComment(approver, pullRequest.number);
  const fullBody = `${body}\n\n${STICKY_MARKER}`;

  if (existingComment === undefined) {
    await approver.github.rest.issues.createComment({
      owner: approver.owner,
      repo: approver.repo,
      issue_number: pullRequest.number,
      body: fullBody
    });

    return;
  }

  await updateComment(approver, existingComment, fullBody);
}

/** Once CI has run, an earlier "waiting" comment is corrected rather than left standing. */
async function updateStickyCommentIfPresent(approver, pullRequest, body) {
  const existingComment = await findStickyComment(approver, pullRequest.number);

  if (existingComment === undefined) {
    return;
  }

  await updateComment(approver, existingComment, `${body}\n\n${STICKY_MARKER}`);
}

async function updateComment(approver, existingComment, fullBody) {
  if (existingComment.body === fullBody) {
    return;
  }

  await approver.github.rest.issues.updateComment({
    owner: approver.owner,
    repo: approver.repo,
    comment_id: existingComment.id,
    body: fullBody
  });
}

async function findStickyComment(approver, pullNumber) {
  const comments = await approver.github.paginate(approver.github.rest.issues.listComments, {
    owner: approver.owner,
    repo: approver.repo,
    issue_number: pullNumber,
    per_page: 100
  });

  return comments.find((comment) => comment.body.includes(STICKY_MARKER));
}

function renderHeldComment(verdict) {
  const lines = [
    "**CI for this pull request is waiting for a maintainer.** It can't run automatically: " + verdict.reason
  ];

  if (verdict.ownedPaths.length > 0) {
    lines.push('', 'Files that need a maintainer to look first:', '', ...verdict.ownedPaths.map((ownedPath) => `- \`${ownedPath}\``));
  }

  lines.push(
    '',
    'Changes to any other files would have run straight away. Maintainers: review those files, then approve the workflow runs on this pull request.'
  );

  return lines.join('\n');
}

function renderRefusedComment(refusals) {
  return [
    '**CI for this pull request is waiting for a maintainer.** GitHub would not let it be approved automatically:',
    '',
    ...refusals.map((refusal) => `- ${refusal}`),
    '',
    'Maintainers: approve the workflow runs on this pull request.'
  ].join('\n');
}

function renderApprovedComment(pullRequest) {
  return `CI was approved automatically for ${pullRequest.head.sha.slice(0, 7)}: the latest changes don't touch any file that needs a maintainer to look first.`;
}

function isDefined(value) {
  return value !== undefined && value !== null;
}

module.exports = { run };
