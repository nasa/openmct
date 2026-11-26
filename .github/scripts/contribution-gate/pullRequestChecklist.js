/**
 * Lays out every check a pull request goes through, in the order it meets them,
 * each marked with whether it has passed yet.
 *
 * Every check is assessed every time, wherever the pull request has got to, so
 * a contributor sees that CI passed even while a contribution rule is still
 * outstanding.
 */

const { CHECKS_REQUIRED_WHEN_REPORTED, DEADLINE_DAYS, REQUIRED_CHECK_NAMES } = require('./config');
const { CHECK_STATUSES, findCheckStatus, summarizeRequiredChecks } = require('./checkStatus');
const { createDoneItem, createInProgressItem, createToDoItem } = require('./checklist');
const { isAiReviewerLogin } = require('./reviewerLogins');

const APPROVED = 'APPROVED';
const FAILED_CHECK_FIX =
  'Open the failed check from the Checks tab to see what went wrong, then push a fix.';
const SHARD_SUFFIX = /\s*\(shard \d+\/\d+\)$/;

/**
 * @param {object} pullRequest as fetchPullRequestContext returns it
 * @param {object} progress
 * @param {object[]} progress.ruleItems the contribution rules, from assessPullRequestRules
 * @param {object[]} progress.threadsAwaitingReply automated review comments with no reply
 * @param {boolean} progress.isTeamReviewRequested whether the maintainers have been asked
 * @returns {{title: string, items: object[]}[]}
 */
function buildPullRequestChecklist(pullRequest, progress) {
  return [
    { title: 'Contribution rules', items: progress.ruleItems },
    {
      title: 'Before the maintainers are asked to review',
      items: assessReadiness(pullRequest, progress.threadsAwaitingReply)
    },
    { title: 'Review', items: assessReview(pullRequest, progress.isTeamReviewRequested) }
  ];
}

function assessReadiness(pullRequest, threadsAwaitingReply) {
  return [
    assessReadyForReview(pullRequest),
    ...groupIntoJobs(REQUIRED_CHECK_NAMES).map((job) =>
      assessJob(pullRequest.checkConclusions, job)
    ),
    ...CHECKS_REQUIRED_WHEN_REPORTED.map((name) =>
      assessCheckIfRun(pullRequest.checkConclusions, name)
    ),
    ...assessReplies(threadsAwaitingReply),
    assessAiApproval(pullRequest)
  ];
}

function assessReview(pullRequest, isTeamReviewRequested) {
  return [
    assessTeamReviewRequest(isTeamReviewRequested),
    assessTeamApproval(pullRequest, isTeamReviewRequested)
  ];
}

function assessReadyForReview(pullRequest) {
  const label = 'Marked ready for review';

  if (pullRequest.isDraft === false) {
    return createDoneItem(label);
  }

  return createToDoItem(
    label,
    `This is a draft. Mark it ready for review when you would like a review. Until then it has ${DEADLINE_DAYS.draftPullRequest} days, rather than ${DEADLINE_DAYS.readyPullRequest}, to meet the contribution rules.`
  );
}

/**
 * A job split into shards runs as several checks, one per shard, and is shown
 * as one line.
 *
 * @returns {{name: string, checkNames: string[]}[]} in the order first listed
 */
function groupIntoJobs(checkNames) {
  const checkNamesByJob = new Map();

  checkNames.forEach((checkName) => {
    const jobName = checkName.replace(SHARD_SUFFIX, '');

    checkNamesByJob.set(jobName, [...(checkNamesByJob.get(jobName) ?? []), checkName]);
  });

  return [...checkNamesByJob].map(([name, jobCheckNames]) => ({ name, checkNames: jobCheckNames }));
}

/** A failed shard is named, since the job's line alone does not say which. */
function assessJob(checkConclusions, job) {
  const isSharded = job.checkNames.length > 1;
  const label = isSharded ? `\`${job.name}\` passes on every shard` : `\`${job.name}\` passes`;
  const statuses = job.checkNames.map((name) => findCheckStatus(checkConclusions, name));
  const failedShards = job.checkNames.filter(
    (name, index) => statuses[index] === CHECK_STATUSES.failed
  );

  if (failedShards.length > 0) {
    const failedNames = failedShards.map((name) => `\`${name}\``).join(', ');

    return createToDoItem(
      label,
      isSharded ? `Failed: ${failedNames}. ${FAILED_CHECK_FIX}` : FAILED_CHECK_FIX
    );
  }

  if (statuses.some(isUnfinished)) {
    return createInProgressItem(label);
  }

  return createDoneItem(label);
}

function assessCheck(checkConclusions, name, label) {
  const status = findCheckStatus(checkConclusions, name);

  if (status === CHECK_STATUSES.passed) {
    return createDoneItem(label);
  }

  if (isUnfinished(status)) {
    return createInProgressItem(label);
  }

  return createToDoItem(label, FAILED_CHECK_FIX);
}

/**
 * A check that does not run on every change, such as CodeQL, which skips changes
 * to tests and documentation alone. Like the gate, the checklist stops waiting
 * for it once every required check has reported.
 */
function assessCheckIfRun(checkConclusions, name) {
  const label = `\`${name}\` passes, if it runs for this change`;
  const isUnreported = findCheckStatus(checkConclusions, name) === CHECK_STATUSES.unreported;

  if (isUnreported && summarizeRequiredChecks(checkConclusions).pending.length === 0) {
    return createDoneItem(label);
  }

  return assessCheck(checkConclusions, name, label);
}

/** CodeRabbit's comments and CodeQL's findings each get their own line. */
function assessReplies(threadsAwaitingReply) {
  const aiThreads = threadsAwaitingReply.filter(isStartedByAiReviewer);
  const securityThreads = threadsAwaitingReply.filter((thread) => !isStartedByAiReviewer(thread));

  return [assessRepliesTo('CodeRabbit', aiThreads), assessRepliesTo('CodeQL', securityThreads)];
}

function assessRepliesTo(reviewerName, threadsAwaitingReply) {
  const label = `Every comment from ${reviewerName} has a reply`;

  if (threadsAwaitingReply.length === 0) {
    return createDoneItem(label);
  }

  return createToDoItem(
    label,
    `Waiting for a reply: ${threadsAwaitingReply.length}, listed below.`
  );
}

function assessAiApproval(pullRequest) {
  const label = 'CodeRabbit approves';

  if (pullRequest.aiReviewState === APPROVED) {
    return createDoneItem(label);
  }

  return createToDoItem(
    label,
    'It approves once its pre-merge checks above pass and its comments are answered, and looks again each time you push.'
  );
}

function assessTeamReviewRequest(isTeamReviewRequested) {
  const label = 'The maintainers are asked to review';

  if (isTeamReviewRequested) {
    return createDoneItem(label);
  }

  return createToDoItem(label, 'This happens automatically once everything above is ticked.');
}

/** A maintainer's approval is the second of the two a pull request needs to merge. */
function assessTeamApproval(pullRequest, isTeamReviewRequested) {
  const label = 'A maintainer approves';

  if (pullRequest.isApprovedByTeam === true) {
    return createDoneItem(label);
  }

  if (isTeamReviewRequested) {
    return createInProgressItem(label);
  }

  return createToDoItem(label);
}

/** Running, or not yet reported at all. */
function isUnfinished(status) {
  return status === CHECK_STATUSES.pending || status === CHECK_STATUSES.unreported;
}

function isStartedByAiReviewer(thread) {
  return isAiReviewerLogin(thread.comments[0].author.login);
}

module.exports = { buildPullRequestChecklist };
