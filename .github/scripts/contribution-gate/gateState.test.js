/**
 * Tests for the gate's bookkeeping: its clock, its stored state, how it reads
 * review threads and checks, and what wakes it up.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  findContributionKind,
  findDeadline,
  formatDeadline,
  isPastDeadline,
  isTeamAuthor,
  isWithinReminderWindow
} = require('./deadlines');
const { readMarker, renderMarker } = require('./stateMarker');
const { findRepliedOpenThreads, findThreadsAwaitingReply } = require('./reviewThreads');
const { summarizeRequiredChecks } = require('./checkStatus');
const { REQUIRED_CHECK_NAMES } = require('./config');
const { TRIGGER_KINDS, findTrigger } = require('./trigger');
const { renderPullRequestComment } = require('./feedbackComment');

const NOTICE_SENT_AT = '2026-09-01T00:00:00.000Z';
const AI_COMMENT = { author: { login: 'copilot-pull-request-reviewer[bot]' }, body: 'Consider extracting this.', url: 'https://example.test/1' };
const AUTHOR_REPLY = { author: { login: 'contributor' }, body: 'Fixed in abc1234.', url: 'https://example.test/2' };

test('a ready pull request has a week, a draft has a month', () => {
  const readyDeadline = findDeadline(NOTICE_SENT_AT, 'readyPullRequest');
  const draftDeadline = findDeadline(NOTICE_SENT_AT, 'draftPullRequest');

  assert.equal(formatDeadline(readyDeadline), '2026-09-08');
  assert.equal(formatDeadline(draftDeadline), '2026-10-01');
});

test('the clock runs from the notice, not from when the work was opened', () => {
  const dayBeforeDeadline = new Date('2026-09-07T12:00:00.000Z');
  const dayAfterDeadline = new Date('2026-09-09T00:00:00.000Z');

  assert.equal(isPastDeadline(NOTICE_SENT_AT, 'readyPullRequest', dayBeforeDeadline), false);
  assert.equal(isPastDeadline(NOTICE_SENT_AT, 'readyPullRequest', dayAfterDeadline), true);
});

test('one reminder goes out in the two days before the deadline', () => {
  assert.equal(isWithinReminderWindow(NOTICE_SENT_AT, 'readyPullRequest', new Date('2026-09-05T00:00:00.000Z')), false);
  assert.equal(isWithinReminderWindow(NOTICE_SENT_AT, 'readyPullRequest', new Date('2026-09-06T01:00:00.000Z')), true);
  assert.equal(isWithinReminderWindow(NOTICE_SENT_AT, 'readyPullRequest', new Date('2026-09-09T00:00:00.000Z')), false, 'past the deadline is not a reminder');
});

test('draft state decides which deadline applies', () => {
  assert.equal(findContributionKind({ isPullRequest: true, isDraft: true }), 'draftPullRequest');
  assert.equal(findContributionKind({ isPullRequest: true, isDraft: false }), 'readyPullRequest');
  assert.equal(findContributionKind({ isPullRequest: false }), 'issue');
});

test('the team is never closed out, outside contributors are', () => {
  assert.equal(isTeamAuthor({ authorLogin: 'someone', authorAssociation: 'MEMBER' }), true);
  assert.equal(isTeamAuthor({ authorLogin: 'someone', authorAssociation: 'COLLABORATOR' }), true);
  assert.equal(isTeamAuthor({ authorLogin: 'someone', authorAssociation: 'CONTRIBUTOR' }), false);
  assert.equal(isTeamAuthor({ authorLogin: 'someone', authorAssociation: 'NONE' }), false);
});

test('state survives a round trip through the sticky comment', () => {
  const state = { noncompliantSince: NOTICE_SENT_AT, aiReviewRequestedSha: 'abc1234' };
  const commentBody = `Some feedback.\n\n${renderMarker(state)}`;

  assert.deepEqual(readMarker(commentBody), state);
});

test('a comment with no marker, or a corrupt one, reads as no state', () => {
  assert.deepEqual(readMarker('Just a comment.'), {});
  assert.deepEqual(readMarker('<!-- openmct-gate {not json} -->'), {});
});

test('an AI comment with no reply blocks the team review', () => {
  const threads = [{ id: 'a', isResolved: true, comments: [AI_COMMENT] }];

  assert.deepEqual(findThreadsAwaitingReply(threads).map((thread) => thread.id), ['a']);
});

test('a replied thread counts as addressed, resolved or not', () => {
  const threads = [
    { id: 'replied-and-resolved', isResolved: true, comments: [AI_COMMENT, AUTHOR_REPLY] },
    { id: 'replied-still-open', isResolved: false, comments: [AI_COMMENT, AUTHOR_REPLY] }
  ];

  assert.deepEqual(findThreadsAwaitingReply(threads), []);
  assert.deepEqual(findRepliedOpenThreads(threads).map((thread) => thread.id), ['replied-still-open']);
});

test('threads a person started are not the AI reviewer\'s business', () => {
  const threads = [{ id: 'human', isResolved: false, comments: [AUTHOR_REPLY] }];

  assert.deepEqual(findThreadsAwaitingReply(threads), []);
  assert.deepEqual(findRepliedOpenThreads(threads), []);
});

test('the AI reviewer talking to itself is not a reply', () => {
  const threads = [{ id: 'a', isResolved: false, comments: [AI_COMMENT, { ...AI_COMMENT, body: 'Still worth a look.' }] }];

  assert.deepEqual(findThreadsAwaitingReply(threads).map((thread) => thread.id), ['a']);
});

test('checks must all report before the gate pays for a review', () => {
  const allGreen = new Map(REQUIRED_CHECK_NAMES.map((name) => [name, 'success']));
  const oneMissing = new Map(allGreen);
  const oneFailed = new Map(allGreen);

  oneMissing.delete('lint');
  oneFailed.set('lint', 'failure');

  assert.equal(summarizeRequiredChecks(allGreen).allPassed, true);
  assert.deepEqual(summarizeRequiredChecks(oneMissing).pending, ['lint']);
  assert.deepEqual(summarizeRequiredChecks(oneFailed).failing, ['lint']);
});

test('a skipped check does not hold a contribution up', () => {
  const conclusions = new Map(REQUIRED_CHECK_NAMES.map((name) => [name, 'success']));

  conclusions.set('visual-a11y-ci', 'skipped');

  assert.equal(summarizeRequiredChecks(conclusions).allPassed, true);
});

test('a comment saying /recheck asks the gate to look again', () => {
  const trigger = findTrigger({
    context: {
      eventName: 'issue_comment',
      payload: { issue: { number: 12, pull_request: {} }, comment: { body: 'fixed now, /recheck please' } }
    },
    env: {}
  });

  assert.deepEqual(trigger, { kind: TRIGGER_KINDS.contribution, number: 12, isRecheck: true });
});

test('the two schedules do different jobs', () => {
  const poll = findTrigger({ context: { eventName: 'schedule', payload: { schedule: '*/30 * * * *' } }, env: {} });
  const sweep = findTrigger({ context: { eventName: 'schedule', payload: { schedule: '17 6 * * *' } }, env: {} });

  assert.equal(poll.kind, TRIGGER_KINDS.poll);
  assert.equal(sweep.kind, TRIGGER_KINDS.sweep);
});

test('a listener hands the gate the pull request number a fork event hides', () => {
  const trigger = findTrigger({
    context: { eventName: 'workflow_run', payload: { workflow_run: { pull_requests: [], head_branch: 'fix', head_repository: { owner: { login: 'contributor' } } } } },
    env: { GATE_TARGET_NUMBER: '99' }
  });

  assert.deepEqual(trigger, { kind: TRIGGER_KINDS.contribution, number: 99 });
});

test('without that number the gate falls back to the branch', () => {
  const trigger = findTrigger({
    context: { eventName: 'workflow_run', payload: { workflow_run: { pull_requests: [], head_branch: 'fix', head_repository: { owner: { login: 'contributor' } } } } },
    env: {}
  });

  assert.deepEqual(trigger, { kind: TRIGGER_KINDS.workflowRun, headBranch: 'fix', headRepositoryOwner: 'contributor' });
});

test('the comment tells a contributor what is left and when it closes', () => {
  const body = renderPullRequestComment({
    stageStatuses: { compliance: false },
    failures: [{ id: 'pr-description', summary: 'The **Describe your changes** section is empty.', fix: 'Say what you changed.' }],
    deadline: { date: findDeadline(NOTICE_SENT_AT, 'readyPullRequest'), contributionKind: 'readyPullRequest' },
    state: { noncompliantSince: NOTICE_SENT_AT }
  });

  assert.match(body, /What is needed next/);
  assert.match(body, /Say what you changed\./);
  assert.match(body, /2026-09-08/);
  assert.match(body, /\/recheck/);
  assert.match(body, /convert this pull request to a draft/);
  assert.deepEqual(readMarker(body), { noncompliantSince: NOTICE_SENT_AT });
});

test('an unanswered AI comment is spelled out, with a link', () => {
  const body = renderPullRequestComment({
    stageStatuses: { compliance: true, checks: true },
    failures: [],
    threadsAwaitingReply: [
      { id: 'a', isResolved: true, path: 'src/plugins/plot/Plot.js', line: 42, url: 'https://example.test/1', summary: 'Consider extracting this.' }
    ],
    state: {}
  });

  assert.match(body, /AI review comments still needing a reply/);
  assert.match(body, /src\/plugins\/plot\/Plot\.js:42/);
  assert.match(body, /resolved, but no reply yet/);
  assert.match(body, /no need to un-resolve/);
});
