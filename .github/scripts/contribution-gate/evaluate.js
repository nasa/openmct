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

  if (shouldLeaveAlone(pullRequest, trigger)) {
    evaluator.core.info(`Skipping #${pullRequest.number}: ${describeWhySkipped(pullRequest)}.`);

    return;
  }

  const { stickyComment } = pullRequest;
  const ruleItems = assessPullRequestRules(pullRequest, pullRequest.linkedIssues);
  const report = {
    evaluator,
    contribution: pullRequest,
    ruleItems,
    failures: listFailures(ruleItems),
    threadsAwaitingReply: findThreadsAwaitingReply(pullRequest.reviewThreads),
    state: readMarker(stickyComment === undefined ? '' : stickyComment.body),
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
  const state = readMarker(stickyComment === undefined ? '' : stickyComment.body);
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
  const clockedState = startClock(report.state, evaluator.now);
  const deadline = findDeadlineFor(contribution, clockedState);
  const { state, isClosed } = await closeOrRemind(report, clockedState, deadline);

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
  const clockedState = startClock(report.state, evaluator.now);
  const deadline = findDeadlineFor(contribution, clockedState);
  const { state, isClosed } = await closeOrRemind(report, clockedState, deadline);

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
  const { contribution, evaluator, state, stickyComment } = report;
  const wasInTheGate =
    contribution.labels.includes(STAGE_LABELS.needsCompliance) || stickyComment !== undefined;

  await reopenIfRequested(report);

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
  const state = stopClock(report.state);

  await reopenIfRequested(report);

  const progress = await findProgress(report, state);

  await evaluator.gate.setStage(contribution.number, progress.stage, contribution.labels);
  await writeStickyComment(
    report,
    renderPullRequestComment({
      checklist: buildChecklist(report, {
        isTeamReviewRequested: progress.stage === STAGE_LABELS.teamReview
      }),
      threadsAwaitingReply: report.threadsAwaitingReply,
      waitingNote: progress.waitingNote,
      state: progress.state
    })
  );
}

/**
 * Decides how far a compliant pull request has got, performing the one-off
 * actions each step needs on the way.
 */
async function findProgress(report, state) {
  const { contribution } = report;

  if (contribution.isDraft === true) {
    return atStage(STAGE_LABELS.awaitingCi, state);
  }

  if (summarizeRequiredChecks(contribution.checkConclusions).allPassed === false) {
    return atStage(STAGE_LABELS.awaitingCi, state);
  }

  return finishAutomatedReviews(report, state);
}

/**
 * Every automated reviewer's comments, from CodeRabbit and CodeQL, need an
 * answer before a person is asked to look, and CodeRabbit must have approved,
 * because its approval is one of the two a pull request needs to merge.
 */
async function finishAutomatedReviews(report, state) {
  const { contribution, evaluator } = report;

  await resolveThreadsAlreadyAnswered(evaluator, contribution);

  if (report.threadsAwaitingReply.length > 0 || contribution.aiReviewState !== APPROVED) {
    return atStage(STAGE_LABELS.automatedReview, state);
  }

  return requestTeamReview(evaluator, contribution, state);
}

async function requestTeamReview(evaluator, contribution, state) {
  if (state.teamReviewRequested !== true) {
    await notifyTeam(evaluator, contribution);
  }

  return atStage(
    STAGE_LABELS.teamReview,
    { ...state, teamReviewRequested: true },
    TEAM_REVIEW_NOTE
  );
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

function atStage(stage, state, waitingNote) {
  return { stage, state, waitingNote };
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
 * that goes out before that happens.
 *
 * @returns {{state: object, isClosed: boolean}} the state to store, which
 * records a sent reminder so that only one is ever sent, and whether the
 * contribution is now closed
 */
async function closeOrRemind(report, state, deadline) {
  const { contribution, evaluator, failures } = report;

  if (contribution.state !== OPEN_STATE) {
    return { state, isClosed: true };
  }

  if (deadline === undefined) {
    return { state, isClosed: false };
  }

  const contributionKind = findContributionKind(contribution);

  if (isPastDeadline(state.noncompliantSince, contributionKind, evaluator.now)) {
    await evaluator.gate.closeContribution(contribution.number, renderClosingComment({ failures }));

    return { state, isClosed: true };
  }

  if (shouldRemind(state, contributionKind, evaluator.now) === false) {
    return { state, isClosed: false };
  }

  await evaluator.gate.postComment(
    contribution.number,
    renderReminderComment({ failures, deadline })
  );

  return { state: { ...state, reminderPostedAt: evaluator.now.toISOString() }, isClosed: false };
}

/** A closed contribution is told how to reopen, not shown a deadline that has passed. */
function describeDeadline(deadline, isClosed) {
  if (isClosed) {
    return { waitingNote: CLOSED_NOTE };
  }

  return { deadline };
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

function reportNothingToDo(evaluator, trigger) {
  evaluator.core.info(`Nothing for the gate to do for this event (${trigger.kind}).`);
}

module.exports = { run };
