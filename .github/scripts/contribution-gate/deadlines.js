/**
 * Works out how long a non-compliant contribution has left.
 *
 * The clock starts when the gate first tells the author what is missing, not
 * when the contribution was opened, so nobody loses time to a notice they never
 * saw. Draft pull requests get far longer, which gives a busy contributor an
 * easy way to ask for more time.
 */

const { DEADLINE_DAYS, REMINDER_LEAD_DAYS, TEAM_ALLOWLIST, TEAM_AUTHOR_ASSOCIATIONS } = require('./config');

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const CONTRIBUTION_KINDS = {
  issue: 'issue',
  readyPullRequest: 'readyPullRequest',
  draftPullRequest: 'draftPullRequest'
};

function findDeadline(noncompliantSince, contributionKind) {
  const allowedDays = DEADLINE_DAYS[contributionKind];
  const startedAt = new Date(noncompliantSince).getTime();

  return new Date(startedAt + allowedDays * MILLISECONDS_PER_DAY);
}

function isPastDeadline(noncompliantSince, contributionKind, now) {
  return now.getTime() >= findDeadline(noncompliantSince, contributionKind).getTime();
}

function isWithinReminderWindow(noncompliantSince, contributionKind, now) {
  const deadline = findDeadline(noncompliantSince, contributionKind).getTime();
  const reminderStartsAt = deadline - REMINDER_LEAD_DAYS * MILLISECONDS_PER_DAY;

  return now.getTime() >= reminderStartsAt && now.getTime() < deadline;
}

function findContributionKind(contribution) {
  if (contribution.isPullRequest === false) {
    return CONTRIBUTION_KINDS.issue;
  }

  if (contribution.isDraft === true) {
    return CONTRIBUTION_KINDS.draftPullRequest;
  }

  return CONTRIBUTION_KINDS.readyPullRequest;
}

/** Team members are never closed out by the gate. */
function isTeamAuthor(contribution) {
  if (TEAM_ALLOWLIST.includes(contribution.authorLogin)) {
    return true;
  }

  return TEAM_AUTHOR_ASSOCIATIONS.includes(contribution.authorAssociation);
}

function formatDeadline(deadline) {
  return deadline.toISOString().slice(0, 10);
}

module.exports = {
  CONTRIBUTION_KINDS,
  findContributionKind,
  findDeadline,
  formatDeadline,
  isPastDeadline,
  isTeamAuthor,
  isWithinReminderWindow
};
