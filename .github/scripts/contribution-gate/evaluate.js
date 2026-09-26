/**
 * The contribution gate.
 *
 * Everything an open source contribution goes through before a maintainer is
 * asked to spend time on it:
 *
 *   1-4. the contribution rules, with feedback and a deadline
 *   5.   the automated checks, then one AI code review
 *   6.   every AI comment answered, then the team is asked to review
 *
 * A contribution only ever moves as far as it has earned, and can move back.
 */

const {
  AI_REVIEW_AGAIN_LABEL,
  GATE_EXEMPT_LABEL,
  MAXIMUM_INTAKE_PER_SWEEP,
  NO_MILESTONE_LABEL,
  STAGE_LABELS,
  TYPE_LABEL_PREFIX
} = require('./config');
const { GateActions } = require('./gateActions');
const { describeCheckState, summarizeRequiredChecks } = require('./checkStatus');
const {
  findContributionKind,
  findDeadline,
  isPastDeadline,
  isTeamAuthor,
  isWithinReminderWindow
} = require('./deadlines');
const {
  fetchContributionsWithLabels,
  fetchIssueContext,
  fetchOpenContributions,
  fetchPullRequestContext,
  fetchPullRequestsForHead,
  fetchPullRequestsReferencingIssue,
  fetchStickyComment
} = require('./fetchContext');
const {
  renderClosingComment,
  renderIssueComment,
  renderPullRequestComment,
  renderReminderComment
} = require('./feedbackComment');
const { findIssueFailures } = require('./issueCompliance');
const { findPullRequestFailures } = require('./prCompliance');
const { findRepliedOpenThreads, findThreadsAwaitingReply } = require('./reviewThreads');
const { readMarker } = require('./stateMarker');
const { TRIGGER_KINDS, findTrigger } = require('./trigger');

const OPEN_STATE = 'OPEN';
const DRAFT_WAITING_NOTE =
  'This is a draft, so the AI review has not been requested yet. Mark it ready for review when you would like that to happen.';
const AI_REVIEW_REQUESTED_NOTE =
  'An AI code review has been requested. Its comments usually arrive within a few minutes.';

/** Entry point called by the workflow. */
async function run({ github, context, core }) {
  const evaluator = createEvaluator({ github, context, core });
  const trigger = findTrigger({ context, env: process.env });

  core.info(`Contribution gate trigger: ${JSON.stringify(trigger)}`);

  await act(evaluator, trigger);
}

function createEvaluator({ github, context, core }) {
  const { owner, repo } = context.repo;
  const dryRun = process.env.GATE_DRY_RUN !== 'false';

  if (dryRun === true) {
    core.info('The gate is in dry-run mode: it will report what it would do, and change nothing.');
  }

  return {
    core,
    now: new Date(),
    reader: { github, owner, repo },
    gate: new GateActions({ github, core, owner, repo, dryRun })
  };
}

async function act(evaluator, trigger) {
  const handlers = {
    [TRIGGER_KINDS.contribution]: evaluateContribution,
    [TRIGGER_KINDS.issueActivity]: evaluateIssueAndItsPullRequests,
    [TRIGGER_KINDS.workflowRun]: evaluateBranchPullRequests,
    [TRIGGER_KINDS.poll]: pollContributionsPastCompliance,
    [TRIGGER_KINDS.sweep]: sweepOpenContributions,
    [TRIGGER_KINDS.nothing]: reportNothingToDo
  };

  await handlers[trigger.kind](evaluator, trigger);
}

async function evaluateContribution(evaluator, trigger) {
  const contribution = await fetchIssueContext(evaluator.reader, trigger.number);

  if (contribution.isPullRequest === true) {
    await evaluatePullRequest(evaluator, trigger);

    return;
  }

  await evaluateIssue(evaluator, trigger, contribution);
}

async function evaluatePullRequest(evaluator, trigger) {
  const pullRequest = await fetchPullRequestContext(evaluator.reader, trigger.number);

  if (shouldLeaveAlone(pullRequest, trigger)) {
    evaluator.core.info(`Skipping #${pullRequest.number}: ${describeWhySkipped(pullRequest)}.`);

    return;
  }

  const stickyComment = await fetchStickyComment(evaluator.reader, pullRequest.number);
  const state = readMarker(stickyComment === undefined ? '' : stickyComment.body);
  const failures = findPullRequestFailures(pullRequest, pullRequest.linkedIssues);
  const report = { evaluator, contribution: pullRequest, failures, state, stickyComment, trigger };

  if (failures.length > 0) {
    await handleNonCompliantPullRequest(report);

    return;
  }

  await advanceCompliantPullRequest(report);
}

async function evaluateIssue(evaluator, trigger, issue) {
  const stickyComment = await fetchStickyComment(evaluator.reader, issue.number);
  const state = readMarker(stickyComment === undefined ? '' : stickyComment.body);
  const failures = findIssueFailures(issue);
  const report = { evaluator, contribution: issue, failures, state, stickyComment, trigger };

  if (failures.length === 0) {
    await handleCompliantIssue(report);

    return;
  }

  await handleNonCompliantIssue(report);
}

/** An edit to an issue can make, or break, the pull requests that close it. */
async function evaluateIssueAndItsPullRequests(evaluator, trigger) {
  await evaluateContribution(evaluator, trigger);

  const dependentPullRequests = await fetchPullRequestsReferencingIssue(evaluator.reader, trigger.number);

  await evaluateEach(evaluator, dependentPullRequests);
}

/** A finished CI run tells us a branch, which may belong to a fork's pull request. */
async function evaluateBranchPullRequests(evaluator, trigger) {
  const head = { owner: trigger.headRepositoryOwner, branch: trigger.headBranch };
  const pullRequests = await fetchPullRequestsForHead(evaluator.reader, head);

  await evaluateEach(evaluator, pullRequests);
}

/**
 * Catches anything the events miss, above all a review thread resolved by
 * clicking rather than replying, which GitHub Actions is never told about.
 */
async function pollContributionsPastCompliance(evaluator) {
  const labels = [STAGE_LABELS.awaitingCi, STAGE_LABELS.aiReview];
  const contributions = await fetchContributionsWithLabels(evaluator.reader, labels);

  evaluator.core.info(`Polling ${contributions.length} contribution(s) past the compliance stage.`);

  await evaluateEach(evaluator, contributions);
}

/**
 * Once a day: move every contribution the gate already knows about, and
 * introduce a bounded number of the ones it does not.
 */
async function sweepOpenContributions(evaluator) {
  const contributions = await fetchOpenContributions(evaluator.reader);
  const known = contributions.filter(hasGateLabel);
  const newcomers = contributions.filter((contribution) => hasGateLabel(contribution) === false);
  const intake = newcomers.slice(0, MAXIMUM_INTAKE_PER_SWEEP);

  evaluator.core.info(
    `Sweep: ${known.length} contribution(s) already in the gate, ` +
      `${newcomers.length} not yet, taking ${intake.length} of them this run.`
  );

  await evaluateEach(evaluator, [...known, ...intake]);
}

async function evaluateEach(evaluator, contributions) {
  for (const contribution of contributions) {
    await evaluateOneSafely(evaluator, contribution);
  }
}

/** One awkward contribution must not stop the gate looking at the rest. */
async function evaluateOneSafely(evaluator, contribution) {
  try {
    await evaluateContribution(evaluator, { number: contribution.number });
  } catch (error) {
    evaluator.core.warning(`Could not evaluate #${contribution.number}: ${error.message}`);
  }
}

async function handleNonCompliantPullRequest(report) {
  const { contribution, evaluator, failures } = report;
  const clockedState = startClock(report.state, evaluator.now);
  const deadline = findDeadlineFor(contribution, clockedState);
  const state = await closeOrRemind(report, clockedState, deadline);

  await evaluator.gate.setStage(contribution.number, STAGE_LABELS.needsCompliance, contribution.labels);
  await writeStickyComment(report, renderPullRequestComment({
    stageStatuses: {},
    failures,
    deadline,
    state
  }));
}

async function handleNonCompliantIssue(report) {
  const { contribution, evaluator, failures } = report;
  const clockedState = startClock(report.state, evaluator.now);
  const deadline = findDeadlineFor(contribution, clockedState);
  const state = await closeOrRemind(report, clockedState, deadline);

  await evaluator.gate.setStage(contribution.number, STAGE_LABELS.needsCompliance, contribution.labels);
  await writeStickyComment(report, renderIssueComment({ failures, deadline, state }));
}

async function handleCompliantIssue(report) {
  const { contribution, evaluator, state, stickyComment } = report;
  const wasInTheGate = contribution.labels.includes(STAGE_LABELS.needsCompliance) || stickyComment !== undefined;

  await reopenIfRequested(report);

  if (wasInTheGate === false) {
    evaluator.core.info(`Issue #${contribution.number} meets the rules; nothing to say.`);

    return;
  }

  await evaluator.gate.removeLabel(contribution.number, STAGE_LABELS.needsCompliance);
  await writeStickyComment(report, renderIssueComment({ failures: [], state: stopClock(state) }));
}

async function advanceCompliantPullRequest(report) {
  const { contribution, evaluator } = report;
  const state = stopClock(report.state);

  await reopenIfRequested(report);
  await copyTypeLabelFromIssues(evaluator, contribution);
  await markMilestoneDecided(evaluator, contribution);

  const progress = await findProgress(report, state);

  await evaluator.gate.setStage(contribution.number, progress.stage, contribution.labels);
  await writeStickyComment(report, renderPullRequestComment({
    stageStatuses: progress.stageStatuses,
    failures: [],
    threadsAwaitingReply: progress.threadsAwaitingReply,
    waitingNote: progress.waitingNote,
    state: progress.state
  }));
}

/**
 * Decides how far a compliant pull request has got, performing the one-off
 * actions each step needs on the way.
 */
async function findProgress(report, state) {
  const { contribution } = report;

  if (contribution.isDraft === true) {
    return atStage(STAGE_LABELS.awaitingCi, state, { waitingNote: DRAFT_WAITING_NOTE });
  }

  const checkSummary = summarizeRequiredChecks(contribution.checkConclusions);

  if (checkSummary.allPassed === false) {
    return atStage(STAGE_LABELS.awaitingCi, state, { waitingNote: describeCheckState(checkSummary) });
  }

  return findAiReviewProgress(report, state);
}

async function findAiReviewProgress(report, state) {
  const { contribution, evaluator } = report;

  if (needsAiReviewRequest(contribution, state)) {
    return requestAiReview(evaluator, contribution, state);
  }

  if (contribution.hasAiReview === false) {
    return atStage(STAGE_LABELS.aiReview, state, { waitingNote: AI_REVIEW_REQUESTED_NOTE, checksPassed: true });
  }

  await resolveThreadsAlreadyAnswered(evaluator, contribution);

  const threadsAwaitingReply = findThreadsAwaitingReply(contribution.reviewThreads);

  if (threadsAwaitingReply.length > 0) {
    return atStage(STAGE_LABELS.aiReview, state, { threadsAwaitingReply, checksPassed: true });
  }

  return requestTeamReview(evaluator, contribution, state);
}

async function requestAiReview(evaluator, contribution, state) {
  await evaluator.gate.requestAiReview(contribution.number);
  await evaluator.gate.removeLabel(contribution.number, AI_REVIEW_AGAIN_LABEL);

  return atStage(STAGE_LABELS.aiReview, { ...state, aiReviewRequestedSha: contribution.headSha }, {
    waitingNote: AI_REVIEW_REQUESTED_NOTE,
    checksPassed: true
  });
}

async function requestTeamReview(evaluator, contribution, state) {
  if (state.teamReviewRequested !== true) {
    await evaluator.gate.requestTeamReview(contribution.number);
  }

  return atStage(STAGE_LABELS.teamReview, { ...state, teamReviewRequested: true }, {
    waitingNote: 'Everything automated is done, and the maintainers have been asked to review. Thank you for your patience.',
    checksPassed: true,
    aiReviewAddressed: true,
    teamReviewRequested: true
  });
}

/** Answering a comment is enough; the gate does the clicking. */
async function resolveThreadsAlreadyAnswered(evaluator, contribution) {
  const answeredThreads = findRepliedOpenThreads(contribution.reviewThreads);

  for (const thread of answeredThreads) {
    await evaluator.gate.resolveReviewThread(thread.id);
  }
}

function atStage(stage, state, progress = {}) {
  return {
    stage,
    state,
    threadsAwaitingReply: progress.threadsAwaitingReply,
    waitingNote: progress.waitingNote,
    stageStatuses: {
      compliance: true,
      checks: progress.checksPassed === true,
      aiReview: progress.aiReviewAddressed === true,
      teamReview: progress.teamReviewRequested === true
    }
  };
}

function needsAiReviewRequest(contribution, state) {
  if (contribution.labels.includes(AI_REVIEW_AGAIN_LABEL)) {
    return true;
  }

  return state.aiReviewRequestedSha === undefined;
}

/**
 * Closes a contribution that has run out of time, or sends the single reminder
 * that goes out before that happens.
 *
 * @returns {object} the state to store, which records a sent reminder so that
 * only one is ever sent
 */
async function closeOrRemind(report, state, deadline) {
  const { contribution, evaluator, failures } = report;

  if (deadline === undefined || contribution.state !== OPEN_STATE) {
    return state;
  }

  const contributionKind = findContributionKind(contribution);

  if (isPastDeadline(state.noncompliantSince, contributionKind, evaluator.now)) {
    await evaluator.gate.closeContribution(contribution.number, renderClosingComment({ failures }));

    return state;
  }

  if (shouldRemind(state, contributionKind, evaluator.now) === false) {
    return state;
  }

  await evaluator.gate.postComment(contribution.number, renderReminderComment({ failures, deadline }));

  return { ...state, reminderPostedAt: evaluator.now.toISOString() };
}

function shouldRemind(state, contributionKind, now) {
  if (state.reminderPostedAt !== undefined) {
    return false;
  }

  return isWithinReminderWindow(state.noncompliantSince, contributionKind, now);
}

/** Team members are held to the same rules, but the gate never closes their work. */
function findDeadlineFor(contribution, state) {
  if (isTeamAuthor(contribution)) {
    return undefined;
  }

  const contributionKind = findContributionKind(contribution);

  return {
    contributionKind,
    date: findDeadline(state.noncompliantSince, contributionKind)
  };
}

async function reopenIfRequested(report) {
  const { contribution, evaluator, trigger } = report;

  if (contribution.state === OPEN_STATE || trigger.isRecheck !== true) {
    return;
  }

  await evaluator.gate.reopenContribution(contribution.number);
}

/** Outside contributors cannot label, so the gate copies the type from the issue. */
async function copyTypeLabelFromIssues(evaluator, pullRequest) {
  if (pullRequest.labels.some(isTypeLabel)) {
    return;
  }

  const issueTypeLabels = pullRequest.linkedIssues.flatMap((issue) => issue.labels.filter(isTypeLabel));

  if (issueTypeLabels.length === 0) {
    return;
  }

  await evaluator.gate.addLabel(pullRequest.number, issueTypeLabels[0]);
}

/** Outside contributors cannot set a milestone either; a label records the decision. */
async function markMilestoneDecided(evaluator, pullRequest) {
  if (pullRequest.hasMilestone === true) {
    await evaluator.gate.removeLabel(pullRequest.number, NO_MILESTONE_LABEL);

    return;
  }

  if (pullRequest.labels.includes(NO_MILESTONE_LABEL)) {
    return;
  }

  await evaluator.gate.addLabel(pullRequest.number, NO_MILESTONE_LABEL);
}

async function writeStickyComment(report, body) {
  const { contribution, evaluator, stickyComment } = report;

  await evaluator.gate.upsertStickyComment(contribution.number, body, stickyComment);
}

function startClock(state, now) {
  if (state.noncompliantSince !== undefined) {
    return { ...state };
  }

  return { ...state, noncompliantSince: now.toISOString() };
}

function stopClock(state) {
  const { noncompliantSince, reminderPostedAt, ...remaining } = state;

  return remaining;
}

function shouldLeaveAlone(pullRequest, trigger) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return true;
  }

  return pullRequest.state !== OPEN_STATE && trigger.isRecheck !== true;
}

function describeWhySkipped(pullRequest) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return `it carries the "${GATE_EXEMPT_LABEL}" label`;
  }

  return `it is ${pullRequest.state.toLowerCase()}`;
}

function hasGateLabel(contribution) {
  return contribution.labels.some((label) => label.startsWith('gate:'));
}

function isTypeLabel(label) {
  return label.startsWith(TYPE_LABEL_PREFIX);
}

function reportNothingToDo(evaluator, trigger) {
  evaluator.core.info(`Nothing for the gate to do for this event (${trigger.kind}).`);
}

module.exports = { run };
