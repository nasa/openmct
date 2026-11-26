/**
 * The contribution gate.
 *
 * Everything an open source contribution goes through before a maintainer is
 * asked to spend time on it:
 *
 *   1-4. the contribution rules, CodeRabbit's pre-merge checks among them, with
 *        feedback and a deadline
 *   5.   the automated checks
 *   6.   every automated review comment answered and CodeRabbit's approval, then
 *        the team is asked to review
 *
 * CodeRabbit and CodeQL review on their own, so the gate never requests them.
 * Branch protection requires two approvals: CodeRabbit's and a maintainer's.
 *
 * A contribution only ever moves as far as it has earned, and can move back.
 */

const {
  GATE_EXEMPT_LABEL,
  MAXIMUM_INTAKE_PER_SWEEP,
  PILOT_LABEL,
  REVIEWER_TEAM_SLUG,
  STAGE_LABELS
} = require('./config');
const { GateActions } = require('./gateActions');
const { summarizeRequiredChecks } = require('./checkStatus');
const { listFailures } = require('./checklist');
const {
  findClosingDate,
  findContributionKind,
  isClosingDue,
  isReminderDue,
  isTeamAuthor
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
  renderReminderComment,
  renderTeamMentionComment
} = require('./feedbackComment');
const { assessIssue } = require('./issueCompliance');
const { assessPullRequestRules } = require('./prCompliance');
const { buildPullRequestChecklist } = require('./pullRequestChecklist');
const { findRepliedOpenThreads, findThreadsAwaitingReply } = require('./reviewThreads');
const { readMarker } = require('./stateMarker');
const { TRIGGER_KINDS, findTrigger } = require('./trigger');

const OPEN_STATE = 'OPEN';
const CLOSED_STATE = 'CLOSED';
const APPROVED = 'APPROVED';
const TEAM_REVIEW_NOTE =
  'Everything automated is done, and the maintainers have been asked to review. Thank you for your patience.';
const CLOSED_NOTE =
  'This is closed because the points above were not addressed in time. Fix them, push any commits you need, then comment `/recheck` and it reopens automatically.';

/** Entry point called by the workflow. */
async function run({ github, context, core }) {
  const evaluator = createEvaluator({ github, context, core });
  const trigger = findTrigger({ context });

  core.info(`Contribution gate trigger: ${JSON.stringify(trigger)}`);

  await act(evaluator, trigger);
}

function createEvaluator({ github, context, core }) {
  const { owner, repo } = context.repo;

  core.info(describeScope());

  return {
    core,
    now: new Date(),
    reader: { github, owner, repo },
    gate: new GateActions({ github, core, owner, repo })
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

  if (isInScope(contribution) === false) {
    evaluator.core.info(
      `Skipping #${contribution.number}: it does not carry the "${PILOT_LABEL}" label.`
    );

    return;
  }

  if (contribution.isPullRequest === true) {
    await evaluatePullRequest(evaluator, trigger);

    return;
  }

  await evaluateIssue(evaluator, trigger, contribution);
}

async function evaluatePullRequest(evaluator, trigger) {
  const pullRequest = await fetchPullRequestContext(evaluator.reader, trigger.number);
  const { stickyComment } = pullRequest;
  const state = readState(stickyComment, pullRequest);

  if (shouldLeaveAlone(pullRequest, trigger, state)) {
    evaluator.core.info(
      `Skipping #${pullRequest.number}: ${describeWhySkipped(pullRequest, state)}.`
    );

    return;
  }

  const ruleItems = assessPullRequestRules(pullRequest, pullRequest.linkedIssues);
  const report = {
    evaluator,
    contribution: pullRequest,
    ruleItems,
    failures: listFailures(ruleItems),
    threadsAwaitingReply: findThreadsAwaitingReply(pullRequest.reviewThreads),
    state,
    stickyComment,
    trigger
  };

  if (report.failures.length > 0) {
    await handleNonCompliantPullRequest(report);

    return;
  }

  await advanceCompliantPullRequest(report);
}

async function evaluateIssue(evaluator, trigger, issue) {
  const stickyComment = await fetchStickyComment(evaluator.reader, issue.number);
  const state = readState(stickyComment, issue);

  if (isLeftClosed(issue, trigger, state)) {
    evaluator.core.info(`Skipping #${issue.number}: ${describeWhyLeftClosed(state)}.`);

    return;
  }

  const issueItems = assessIssue(issue);
  const failures = listFailures(issueItems);
  const report = {
    evaluator,
    contribution: issue,
    failures,
    issueItems,
    state,
    stickyComment,
    trigger
  };

  if (failures.length === 0) {
    await handleCompliantIssue(report);

    return;
  }

  await handleNonCompliantIssue(report);
}

/** An edit to an issue can make, or break, the pull requests that close it. */
async function evaluateIssueAndItsPullRequests(evaluator, trigger) {
  await evaluateContribution(evaluator, trigger);

  const dependentPullRequests = await fetchPullRequestsReferencingIssue(
    evaluator.reader,
    trigger.number
  );

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
  const labels = [STAGE_LABELS.awaitingCi, STAGE_LABELS.automatedReview];
  const contributions = await fetchContributionsWithLabels(evaluator.reader, labels);

  evaluator.core.info(`Polling ${contributions.length} contribution(s) past the compliance stage.`);

  await evaluateEach(evaluator, contributions);
}

/**
 * Once a day: move every contribution the gate already knows about, and
 * introduce a bounded number of the ones it does not.
 */
async function sweepOpenContributions(evaluator) {
  if (PILOT_LABEL !== undefined) {
    await sweepPilotContributions(evaluator);

    return;
  }

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

/** During the pilot there is no backlog to work through, only the opted-in few. */
async function sweepPilotContributions(evaluator) {
  const contributions = await fetchContributionsWithLabels(evaluator.reader, [PILOT_LABEL]);

  evaluator.core.info(
    `Sweep: ${contributions.length} contribution(s) carry the "${PILOT_LABEL}" label.`
  );

  await evaluateEach(evaluator, contributions);
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
  const { contribution, evaluator } = report;
  const { state, isClosed } = await closeOrRemind(report, startClock(report.state, evaluator.now));
  const deadline = findDeadlineFor(contribution, state, evaluator.now);

  await evaluator.gate.setStage(
    contribution.number,
    STAGE_LABELS.needsCompliance,
    contribution.labels
  );
  await writeStickyComment(
    report,
    renderPullRequestComment({
      checklist: buildChecklist(report, { isTeamReviewRequested: false }),
      threadsAwaitingReply: report.threadsAwaitingReply,
      ...describeDeadline(deadline, isClosed),
      state
    })
  );
}

async function handleNonCompliantIssue(report) {
  const { contribution, evaluator } = report;
  const { state, isClosed } = await closeOrRemind(report, startClock(report.state, evaluator.now));
  const deadline = findDeadlineFor(contribution, state, evaluator.now);

  await evaluator.gate.setStage(
    contribution.number,
    STAGE_LABELS.needsCompliance,
    contribution.labels
  );
  await writeStickyComment(
    report,
    renderIssueComment({
      issueItems: report.issueItems,
      ...describeDeadline(deadline, isClosed),
      state
    })
  );
}

async function handleCompliantIssue(report) {
  const { contribution, evaluator, stickyComment } = report;
  const wasInTheGate =
    contribution.labels.includes(STAGE_LABELS.needsCompliance) || stickyComment !== undefined;
  const state = await reopenIfRequested(report);

  if (wasInTheGate === false) {
    evaluator.core.info(`Issue #${contribution.number} meets the rules; nothing to say.`);

    return;
  }

  await evaluator.gate.removeLabel(contribution.number, STAGE_LABELS.needsCompliance);
  await writeStickyComment(
    report,
    renderIssueComment({ issueItems: report.issueItems, state: stopClock(state) })
  );
}

async function advanceCompliantPullRequest(report) {
  const { contribution, evaluator } = report;

  const reopenedState = await reopenIfRequested(report);
  const stage = findStage(report);
  const state = await actOnStage(report, stage, stopClock(reopenedState));
  const isTeamReviewRequested = stage === STAGE_LABELS.teamReview;

  await evaluator.gate.setStage(contribution.number, stage, contribution.labels);
  await writeStickyComment(
    report,
    renderPullRequestComment({
      checklist: buildChecklist(report, { isTeamReviewRequested }),
      threadsAwaitingReply: report.threadsAwaitingReply,
      waitingNote: isTeamReviewRequested ? TEAM_REVIEW_NOTE : undefined,
      state
    })
  );
}

/**
 * How far a compliant pull request has got. Every automated reviewer's
 * comments, from CodeRabbit and CodeQL, need an answer before a person is
 * asked to look, and CodeRabbit must have approved, because its approval is
 * one of the two a pull request needs to merge.
 *
 * @returns {string} the stage label
 */
function findStage(report) {
  const { contribution } = report;
  const isWaitingForCi =
    contribution.isDraft === true ||
    summarizeRequiredChecks(contribution.checkConclusions).allPassed === false;

  if (isWaitingForCi) {
    return STAGE_LABELS.awaitingCi;
  }

  if (report.threadsAwaitingReply.length > 0 || contribution.aiReviewState !== APPROVED) {
    return STAGE_LABELS.automatedReview;
  }

  return STAGE_LABELS.teamReview;
}

/**
 * Does what reaching a stage calls for. Once CI has passed, the gate resolves
 * the automated review threads the contributor has answered; at team review, it
 * asks the team, once.
 *
 * @returns {Promise<object>} the state to store
 */
async function actOnStage(report, stage, state) {
  const { contribution, evaluator } = report;

  if (stage === STAGE_LABELS.awaitingCi) {
    return state;
  }

  await resolveThreadsAlreadyAnswered(evaluator, contribution);

  if (stage !== STAGE_LABELS.teamReview) {
    return state;
  }

  return requestTeamReviewOnce(evaluator, contribution, state);
}

async function requestTeamReviewOnce(evaluator, contribution, state) {
  if (state.teamReviewRequested !== true) {
    await notifyTeam(evaluator, contribution);
  }

  return { ...state, teamReviewRequested: true };
}

/** The review request is the notification, with a comment as the fallback. */
async function notifyTeam(evaluator, pullRequest) {
  const wasRequested = await evaluator.gate.requestTeamReview(pullRequest.number);

  if (wasRequested === true) {
    return;
  }

  const teamHandle = `${evaluator.reader.owner}/${REVIEWER_TEAM_SLUG}`;

  await evaluator.gate.postComment(pullRequest.number, renderTeamMentionComment({ teamHandle }));
}

/** Answering a comment is enough; the gate does the clicking. */
async function resolveThreadsAlreadyAnswered(evaluator, contribution) {
  const answeredThreads = findRepliedOpenThreads(contribution.reviewThreads);

  for (const thread of answeredThreads) {
    await evaluator.gate.resolveReviewThread(thread.id);
  }
}

/** Every check is shown, met or not, whatever stage the pull request has reached. */
function buildChecklist(report, { isTeamReviewRequested }) {
  return buildPullRequestChecklist(report.contribution, {
    ruleItems: report.ruleItems,
    threadsAwaitingReply: report.threadsAwaitingReply,
    isTeamReviewRequested
  });
}

/**
 * Closes a contribution that has run out of time, or sends the single reminder
 * that goes out before that happens. Nothing is closed until that reminder has
 * given its notice.
 *
 * @returns {{state: object, isClosed: boolean}} the state to store, which
 * records a sent reminder so that only one is ever sent, and a closure so that
 * only what the gate closed reopens on /recheck; and whether the contribution
 * is now closed
 */
async function closeOrRemind(report, state) {
  const { contribution, evaluator, failures } = report;
  const contributionKind = findContributionKind(contribution);

  if (contribution.state !== OPEN_STATE) {
    return { state, isClosed: true };
  }

  if (isTeamAuthor(contribution)) {
    return { state, isClosed: false };
  }

  if (isClosingDue(state, contributionKind, evaluator.now)) {
    await evaluator.gate.closeContribution(contribution.number, renderClosingComment({ failures }));

    return { state: { ...state, closedByGate: true }, isClosed: true };
  }

  if (isReminderDue(state, contributionKind, evaluator.now) === false) {
    return { state, isClosed: false };
  }

  const remindedState = { ...state, reminderPostedAt: evaluator.now.toISOString() };
  const deadline = findDeadlineFor(contribution, remindedState, evaluator.now);

  await evaluator.gate.postComment(
    contribution.number,
    renderReminderComment({ failures, deadline })
  );

  return { state: remindedState, isClosed: false };
}

/** A closed contribution is told how to reopen, not shown a deadline that has passed. */
function describeDeadline(deadline, isClosed) {
  if (isClosed) {
    return { waitingNote: CLOSED_NOTE };
  }

  return { deadline };
}

/** Team members are held to the same rules, but the gate never closes their work. */
function findDeadlineFor(contribution, state, now) {
  if (isTeamAuthor(contribution)) {
    return undefined;
  }

  const contributionKind = findContributionKind(contribution);

  return { contributionKind, date: findClosingDate(state, contributionKind, now) };
}

/**
 * Only what the gate closed reopens: anything a maintainer closed, or that
 * merged, stays as it is.
 *
 * @returns {Promise<object>} the state to store
 */
async function reopenIfRequested(report) {
  const { contribution, evaluator, state, trigger } = report;

  if (isReopenRequested(contribution, trigger, state) === false) {
    return state;
  }

  await evaluator.gate.reopenContribution(contribution.number);

  return forgetClosure(state);
}

function isReopenRequested(contribution, trigger, state) {
  return (
    trigger.isRecheck === true && contribution.state === CLOSED_STATE && state.closedByGate === true
  );
}

/**
 * The gate's stored state. A closure it recorded counts only while the
 * contribution is still closed: once reopened, by the gate or by a maintainer,
 * a later close is no longer the gate's.
 */
function readState(stickyComment, contribution) {
  const state = readMarker(stickyComment === undefined ? '' : stickyComment.body);

  if (contribution.state === OPEN_STATE) {
    return forgetClosure(state);
  }

  return state;
}

function forgetClosure(state) {
  return withoutKeys(state, ['closedByGate']);
}

/** A closed contribution is looked at only when /recheck asks to reopen what the gate closed. */
function isLeftClosed(contribution, trigger, state) {
  return (
    contribution.state !== OPEN_STATE && isReopenRequested(contribution, trigger, state) === false
  );
}

function describeWhyLeftClosed(state) {
  if (state.closedByGate === true) {
    return 'the gate closed it, and only /recheck reopens it';
  }

  return 'it was closed or merged, and not by the gate';
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
  return withoutKeys(state, ['noncompliantSince', 'reminderPostedAt']);
}

function withoutKeys(state, keys) {
  return Object.fromEntries(Object.entries(state).filter(([key]) => keys.includes(key) === false));
}

/** While the gate is piloted, it acts only on contributions a maintainer has opted in. */
function isInScope(contribution) {
  if (PILOT_LABEL === undefined) {
    return true;
  }

  return contribution.labels.includes(PILOT_LABEL);
}

function describeScope() {
  if (PILOT_LABEL === undefined) {
    return 'The gate covers every contribution.';
  }

  return `The gate is in its pilot: it acts only on contributions labelled "${PILOT_LABEL}".`;
}

/**
 * The pilot label is checked again on the pull request as fetched, since a
 * maintainer may have removed it since the event that started this run.
 */
function shouldLeaveAlone(pullRequest, trigger, state) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL) || isInScope(pullRequest) === false) {
    return true;
  }

  return isLeftClosed(pullRequest, trigger, state);
}

function describeWhySkipped(pullRequest, state) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return `it carries the "${GATE_EXEMPT_LABEL}" label`;
  }

  if (isInScope(pullRequest) === false) {
    return `it no longer carries the "${PILOT_LABEL}" label`;
  }

  return describeWhyLeftClosed(state);
}

function hasGateLabel(contribution) {
  return contribution.labels.some((label) => label.startsWith('gate:'));
}

function reportNothingToDo(evaluator, trigger) {
  evaluator.core.info(`Nothing for the gate to do for this event (${trigger.kind}).`);
}

module.exports = { run };
