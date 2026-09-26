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

const MET = '✅';
const NOT_YET = '⬜';

const STAGE_ROWS = [
  { key: 'compliance', label: 'Contribution rules met' },
  { key: 'checks', label: 'Automated checks passing' },
  { key: 'aiReview', label: 'Automated review comments addressed' },
  { key: 'teamReview', label: 'Team review requested' }
];

const INTRODUCTION =
  'Thanks for contributing to Open MCT! This comment is kept up to date automatically, ' +
  'so it always shows what is left to do. It is edited in place rather than replaced, ' +
  'and no reviewer time is needed until every box below is ticked.';

function renderPullRequestComment(report) {
  return joinSections([
    INTRODUCTION,
    renderProgressList(report.stageStatuses),
    renderFailures(report.failures),
    renderThreadsAwaitingReply(report.threadsAwaitingReply),
    renderWaitingNote(report.waitingNote),
    renderDeadlineNote(report.deadline),
    renderMarker(report.state)
  ]);
}

function renderIssueComment(report) {
  return joinSections([
    'Thanks for raising this! This comment is kept up to date automatically and shows what is left to do.',
    renderFailures(report.failures),
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

function renderProgressList(stageStatuses) {
  const rows = STAGE_ROWS.map((stage) => renderStageRow(stage, stageStatuses[stage.key]));

  return ['**Progress**', rows.join('\n')].join('\n\n');
}

function renderStageRow(stage, isMet) {
  const symbol = isMet === true ? MET : NOT_YET;

  return `- ${symbol} ${stage.label}`;
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
    'These are from our automated reviewers: Copilot, and CodeQL where it found something. Please reply to each one saying how you addressed it (for example "fixed in abc1234") or why you disagree. A short reply is fine, and it is what a human reviewer reads first. There is no need to un-resolve anything.',
    items.join('\n')
  ].join('\n\n');
}

function renderThreadLine(thread) {
  const location = renderThreadLocation(thread);
  const note = thread.isResolved === true ? ' _(resolved, but no reply yet)_' : '';

  return `- [${location}](${thread.url}): "${thread.summary}"${note}`;
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
  renderReminderComment
};
