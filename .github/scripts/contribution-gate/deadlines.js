/**
 * Works out how long a non-compliant contribution has left.
 *
 * The clock starts when the gate first tells the author what is missing, not
 * when the contribution was opened, so nobody loses time to a notice they never
 * saw. Draft pull requests get far longer, which gives a busy contributor an
 * easy way to ask for more time.
 */

const {
  DEADLINE_DAYS,
  REMINDER_LEAD_DAYS,
  TEAM_ALLOWLIST,
  TEAM_AUTHOR_ASSOCIATIONS
} = require('./config');

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

/**
 * When a contribution may be closed: its deadline, but never sooner than
 * REMINDER_LEAD_DAYS after its reminder, so nobody is closed without the notice
 * CONTRIBUTING.md promises. A draft marked ready late in its month would
 * otherwise be past its seven days already. Until the reminder has gone out,
 * the notice is counted from now.
 */
function findClosingDate(state, contributionKind, now) {
  const deadline = findDeadline(state.noncompliantSince, contributionKind).getTime();
  const noticeStartsAt =
    state.reminderPostedAt === undefined
      ? now.getTime()
      : new Date(state.reminderPostedAt).getTime();

  return new Date(Math.max(deadline, noticeStartsAt + REMINDER_LEAD_DAYS * MILLISECONDS_PER_DAY));
}

/** Only once a reminder has gone out, and the notice it gave has run. */
function isClosingDue(state, contributionKind, now) {
  if (state.reminderPostedAt === undefined) {
    return false;
  }

  return now.getTime() >= findClosingDate(state, contributionKind, now).getTime();
}

/**
 * The one reminder is due from REMINDER_LEAD_DAYS before the deadline, and stays
 * due after the deadline until it has gone out.
 */
function isReminderDue(state, contributionKind, now) {
  if (state.reminderPostedAt !== undefined) {
    return false;
  }

  const deadline = findDeadline(state.noncompliantSince, contributionKind).getTime();

  return now.getTime() >= deadline - REMINDER_LEAD_DAYS * MILLISECONDS_PER_DAY;
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
  findClosingDate,
  findContributionKind,
  findDeadline,
  formatDeadline,
  isClosingDue,
  isReminderDue,
  isTeamAuthor
};
