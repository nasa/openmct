/**
 * Works out what the gate has been woken up for.
 *
 * One workflow handles every path into the gate, so this is where a GitHub event
 * becomes a decision about what to look at.
 */

const { RECHECK_COMMAND } = require('./config');

const TRIGGER_KINDS = {
  contribution: 'contribution',
  issueActivity: 'issueActivity',
  poll: 'poll',
  sweep: 'sweep',
  workflowRun: 'workflowRun',
  nothing: 'nothing'
};

/** The schedule that polls contributions already past the compliance stage. */
const POLL_CRON = '*/30 * * * *';

function findTrigger({ context }) {
  const finders = {
    pull_request_target: findPullRequestTrigger,
    issues: findIssueTrigger,
    issue_comment: findCommentTrigger,
    workflow_run: findWorkflowRunTrigger,
    schedule: findScheduleTrigger,
    workflow_dispatch: findDispatchTrigger
  };
  const finder = finders[context.eventName];

  if (finder === undefined) {
    return { kind: TRIGGER_KINDS.nothing };
  }

  return finder({ context });
}

function findPullRequestTrigger({ context }) {
  return { kind: TRIGGER_KINDS.contribution, number: context.payload.pull_request.number };
}

function findIssueTrigger({ context }) {
  return { kind: TRIGGER_KINDS.issueActivity, number: context.payload.issue.number };
}

function findCommentTrigger({ context }) {
  const isRecheck = context.payload.comment.body.includes(RECHECK_COMMAND);

  if (context.payload.issue.pull_request !== undefined) {
    return { kind: TRIGGER_KINDS.contribution, number: context.payload.issue.number, isRecheck };
  }

  return { kind: TRIGGER_KINDS.issueActivity, number: context.payload.issue.number, isRecheck };
}

/**
 * A finished workflow run tells the gate something has happened, but for a fork's
 * pull request it does not name the pull request, so the gate finds it from the
 * branch the run was for. That covers the CI run, and the listener workflow that
 * runs when someone replies to a review comment, an event which hands a fork's
 * pull request a read-only token.
 */
function findWorkflowRunTrigger({ context }) {
  const workflowRun = context.payload.workflow_run;
  const linkedPullRequest = workflowRun.pull_requests[0];

  if (linkedPullRequest !== undefined) {
    return { kind: TRIGGER_KINDS.contribution, number: linkedPullRequest.number };
  }

  return {
    kind: TRIGGER_KINDS.workflowRun,
    headBranch: workflowRun.head_branch,
    headRepositoryOwner: readHeadRepositoryOwner(workflowRun)
  };
}

function findScheduleTrigger({ context }) {
  if (context.payload.schedule === POLL_CRON) {
    return { kind: TRIGGER_KINDS.poll };
  }

  return { kind: TRIGGER_KINDS.sweep };
}

function findDispatchTrigger({ context }) {
  const requestedNumber = readNumber(context.payload.inputs?.contribution);

  if (requestedNumber !== undefined) {
    return { kind: TRIGGER_KINDS.contribution, number: requestedNumber, isRecheck: true };
  }

  return { kind: TRIGGER_KINDS.sweep };
}

function readHeadRepositoryOwner(workflowRun) {
  if (workflowRun.head_repository === undefined || workflowRun.head_repository === null) {
    return undefined;
  }

  return workflowRun.head_repository.owner.login;
}

function readNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

module.exports = { POLL_CRON, TRIGGER_KINDS, findTrigger };
