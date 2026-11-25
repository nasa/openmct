/**
 * Writes the one comment the gate keeps on a contribution.
 *
 * There is only ever a single comment per contribution, edited in place, so that
 * a contributor being nudged does not collect a pile of notifications. The tone
 * matters: everything here is read by someone who has just given us their work
 * for free.
 */

const { RECHECK_COMMAND } = require('./config');
const { CONTRIBUTION_KINDS, formatDeadline } = require('./deadlines');
const { renderMarker } = require('./stateMarker');
const { quoteContributorText } = require('./quotedText');
const { STATUSES } = require('./checklist');

const STATUS_SYMBOLS = {
  [STATUSES.done]: '✅',
  [STATUSES.toDo]: '⬜',
  [STATUSES.inProgress]: '⏳'
};

const STATUS_KEY = `${STATUS_SYMBOLS.done} done · ${STATUS_SYMBOLS.toDo} not yet · ${STATUS_SYMBOLS.inProgress} in progress, nothing for you to do`;

const INTRODUCTION =
  'Thanks for contributing to Open MCT! Below is every check this pull request goes through, ' +
  'in order, ticked off automatically as each one passes. This comment is edited in place ' +
  'rather than replaced, so it always shows where things stand.';

function renderPullRequestComment(report) {
  return joinSections([
    INTRODUCTION,
    STATUS_KEY,
    ...report.checklist.map(renderChecklistSection),
    renderThreadsAwaitingReply(report.threadsAwaitingReply),
    renderWaitingNote(report.waitingNote),
    renderDeadlineNote(report.deadline),
    renderMarker(report.state)
  ]);
}

function renderIssueComment(report) {
  return joinSections([
    'Thanks for raising this! Below is everything an issue needs, ticked off automatically as each one is done.',
    renderChecklistSection({
      title: 'What this issue needs',
      items: report.issueItems
    }),
    renderWaitingNote(report.waitingNote),
    renderDeadlineNote(report.deadline),
    renderMarker(report.state)
  ]);
}

function renderReminderComment(report) {
  return joinSections([
    `Just a friendly reminder: this will be closed automatically on **${formatDeadline(report.deadline.date)}** unless the points in the checklist comment above are addressed.`,
    renderFailures(report.failures),
    renderExtensionAdvice(report.deadline.contributionKind)
  ]);
}

function renderClosingComment(report) {
  return joinSections([
    'Closing this for now, because the contribution rules below have not been met within the time the process allows. This is not a judgement on the idea or the code.',
    renderFailures(report.failures),
    `Nothing is lost. Address the points above and comment \`${RECHECK_COMMAND}\` here, and this will reopen automatically. If you would rather talk it through first, please open a [discussion](https://github.com/nasa/openmct/discussions).`
  ]);
}

/**
 * Used when the review request could not be applied, so a person is told by a
 * comment instead. Mentioning the team notifies it, which editing the gate's own
 * comment would not.
 */
function renderTeamMentionComment({ teamHandle }) {
  return `@${teamHandle}: this pull request has passed every automated check and is ready for a human review. The automatic review request could not be applied, so this comment is the notification.`;
}

function renderChecklistSection(section) {
  return [`#### ${section.title}`, section.items.map(renderChecklistItem).join('\n')].join('\n\n');
}

/** What to do is shown only while there is something left to do. */
function renderChecklistItem(item) {
  const line = `- ${STATUS_SYMBOLS[item.status]} ${item.label}`;

  if (item.status === STATUSES.done || item.fix === undefined) {
    return line;
  }

  return `${line}\n  - ${item.fix}`;
}

function renderFailures(failures) {
  if (failures === undefined || failures.length === 0) {
    return undefined;
  }

  const items = failures.map((failure) => `- ${failure.summary}\n  - ${failure.fix}`);

  return ['#### What is needed next', items.join('\n')].join('\n\n');
}

function renderThreadsAwaitingReply(threads) {
  if (threads === undefined || threads.length === 0) {
    return undefined;
  }

  const items = threads.map(renderThreadLine);

  return [
    '#### Automated review comments still needing a reply',
    'These are from our automated reviewers: CodeRabbit, and CodeQL where it found something. Please reply to each one saying how you addressed it (for example "fixed in abc1234") or why you disagree. A short reply is fine, and it is what a human reviewer reads first. There is no need to un-resolve anything.',
    items.join('\n')
  ].join('\n\n');
}

function renderThreadLine(thread) {
  const location = renderThreadLocation(thread);
  const note = thread.isResolved === true ? ' _(resolved, but no reply yet)_' : '';

  return `- [${quoteContributorText(location)}](${thread.url}): ${quoteContributorText(thread.summary)}${note}`;
}

function renderThreadLocation(thread) {
  if (thread.line === undefined || thread.line === null) {
    return thread.path;
  }

  return `${thread.path}:${thread.line}`;
}

function renderWaitingNote(waitingNote) {
  if (waitingNote === undefined) {
    return undefined;
  }

  return `_${waitingNote}_`;
}

function renderDeadlineNote(deadline) {
  if (deadline === undefined) {
    return undefined;
  }

  return [
    `If this is still outstanding on **${formatDeadline(deadline.date)}** it will be closed automatically, to keep the review queue honest.`,
    `Nothing is lost when that happens: fix the points above, comment \`${RECHECK_COMMAND}\`, and it reopens.`,
    renderExtensionAdvice(deadline.contributionKind)
  ]
    .filter(isPresent)
    .join(' ');
}

function renderExtensionAdvice(contributionKind) {
  if (contributionKind !== CONTRIBUTION_KINDS.readyPullRequest) {
    return undefined;
  }

  return 'If you need longer, convert this pull request to a draft and you get 30 days instead of 7.';
}

function joinSections(sections) {
  return sections.filter(isPresent).join('\n\n');
}

function isPresent(section) {
  return section !== undefined && section !== null && section !== '';
}

module.exports = {
  renderClosingComment,
  renderIssueComment,
  renderPullRequestComment,
  renderReminderComment,
  renderTeamMentionComment
};
