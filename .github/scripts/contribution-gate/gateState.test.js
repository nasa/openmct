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
  findClosingDate,
  isClosingDue,
  isReminderDue,
  isTeamAuthor
} = require('./deadlines');
const { readMarker, renderMarker } = require('./stateMarker');
const { findRepliedOpenThreads, findThreadsAwaitingReply } = require('./reviewThreads');
const { summarizeRequiredChecks } = require('./checkStatus');
const { REQUIRED_CHECK_NAMES } = require('./config');
const { TRIGGER_KINDS, findTrigger } = require('./trigger');
const { renderIssueComment, renderPullRequestComment } = require('./feedbackComment');
const { assessIssue } = require('./issueCompliance');
const { createDoneItem, createInProgressItem, createToDoItem } = require('./checklist');

const NOTICE_SENT_AT = '2026-09-01T00:00:00.000Z';
const AI_COMMENT = {
  author: { login: 'coderabbitai[bot]' },
  body: 'Consider extracting this.',
  url: 'https://example.test/1'
};
const AUTHOR_REPLY = {
  author: { login: 'contributor' },
  body: 'Fixed in abc1234.',
  url: 'https://example.test/2'
};

test('a ready pull request has a week, a draft has a month', () => {
  const readyDeadline = findDeadline(NOTICE_SENT_AT, 'readyPullRequest');
  const draftDeadline = findDeadline(NOTICE_SENT_AT, 'draftPullRequest');

  assert.equal(formatDeadline(readyDeadline), '2026-09-08');
  assert.equal(formatDeadline(draftDeadline), '2026-10-01');
});

test('the clock runs from the notice, and closing waits for the reminder to have been out two days', () => {
  const reminded = {
    noncompliantSince: NOTICE_SENT_AT,
    reminderPostedAt: '2026-09-06T00:00:00.000Z'
  };
  const notReminded = { noncompliantSince: NOTICE_SENT_AT };
  const dayBeforeDeadline = new Date('2026-09-07T12:00:00.000Z');
  const dayAfterDeadline = new Date('2026-09-09T00:00:00.000Z');

  assert.equal(isClosingDue(reminded, 'readyPullRequest', dayBeforeDeadline), false);
  assert.equal(isClosingDue(reminded, 'readyPullRequest', dayAfterDeadline), true);
  assert.equal(
    isClosingDue(notReminded, 'readyPullRequest', dayAfterDeadline),
    false,
    'never without a reminder'
  );
});

test('a reminder is due two days before the deadline, and still due after it until sent', () => {
  const state = { noncompliantSince: NOTICE_SENT_AT };

  assert.equal(
    isReminderDue(state, 'readyPullRequest', new Date('2026-09-05T00:00:00.000Z')),
    false
  );
  assert.equal(
    isReminderDue(state, 'readyPullRequest', new Date('2026-09-06T01:00:00.000Z')),
    true
  );
  assert.equal(
    isReminderDue(state, 'readyPullRequest', new Date('2026-09-20T00:00:00.000Z')),
    true
  );
  assert.equal(
    isReminderDue(
      { ...state, reminderPostedAt: '2026-09-06T01:00:00.000Z' },
      'readyPullRequest',
      new Date('2026-09-07T00:00:00.000Z')
    ),
    false,
    'only one is ever sent'
  );
});

test('a late reminder moves the closing date to two days after it', () => {
  const state = { noncompliantSince: NOTICE_SENT_AT, reminderPostedAt: '2026-09-20T00:00:00.000Z' };

  assert.equal(
    formatDeadline(
      findClosingDate(state, 'readyPullRequest', new Date('2026-09-20T00:00:00.000Z'))
    ),
    '2026-09-22'
  );
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
  const state = { noncompliantSince: NOTICE_SENT_AT, teamReviewRequested: true };
  const commentBody = `Some feedback.\n\n${renderMarker(state)}`;

  assert.deepEqual(readMarker(commentBody), state);
});

test('a comment with no marker, or a corrupt one, reads as no state', () => {
  assert.deepEqual(readMarker('Just a comment.'), {});
  assert.deepEqual(readMarker('<!-- openmct-gate {not json} -->'), {});
});

test('an AI comment with no reply blocks the team review', () => {
  const threads = [{ id: 'a', isResolved: true, comments: [AI_COMMENT] }];

  assert.deepEqual(
    findThreadsAwaitingReply(threads).map((thread) => thread.id),
    ['a']
  );
});

test('a replied thread counts as addressed, resolved or not', () => {
  const threads = [
    { id: 'replied-and-resolved', isResolved: true, comments: [AI_COMMENT, AUTHOR_REPLY] },
    { id: 'replied-still-open', isResolved: false, comments: [AI_COMMENT, AUTHOR_REPLY] }
  ];

  assert.deepEqual(findThreadsAwaitingReply(threads), []);
  assert.deepEqual(
    findRepliedOpenThreads(threads).map((thread) => thread.id),
    ['replied-still-open']
  );
});

test("threads a person started are not the AI reviewer's business", () => {
  const threads = [{ id: 'human', isResolved: false, comments: [AUTHOR_REPLY] }];

  assert.deepEqual(findThreadsAwaitingReply(threads), []);
  assert.deepEqual(findRepliedOpenThreads(threads), []);
});

test('the AI reviewer talking to itself is not a reply', () => {
  const threads = [
    {
      id: 'a',
      isResolved: false,
      comments: [AI_COMMENT, { ...AI_COMMENT, body: 'Still worth a look.' }]
    }
  ];

  assert.deepEqual(
    findThreadsAwaitingReply(threads).map((thread) => thread.id),
    ['a']
  );
});

test('a CodeQL security finding also needs an explanation', () => {
  // As the GraphQL API names it: without the "[bot]" suffix the REST API adds.
  const securityComment = {
    author: { login: 'github-advanced-security' },
    body: 'Incomplete URL sanitization.',
    url: 'https://example.test/3'
  };
  const threads = [
    { id: 'unanswered', isResolved: true, comments: [securityComment] },
    { id: 'answered', isResolved: false, comments: [securityComment, AUTHOR_REPLY] }
  ];

  assert.deepEqual(
    findThreadsAwaitingReply(threads).map((thread) => thread.id),
    ['unanswered']
  );
  assert.deepEqual(
    findRepliedOpenThreads(threads).map((thread) => thread.id),
    ['answered']
  );
});

test('CodeQL fails a pull request when it runs, and is ignored when it does not', () => {
  const allGreen = new Map(REQUIRED_CHECK_NAMES.map((name) => [name, 'success']));
  const codeqlFailed = new Map(allGreen);

  codeqlFailed.set('Analyze', 'failure');

  assert.equal(
    summarizeRequiredChecks(allGreen).allPassed,
    true,
    'CodeQL skips doc-only changes, which must not stall'
  );
  assert.deepEqual(summarizeRequiredChecks(codeqlFailed).failing, ['Analyze']);
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

  conclusions.set('visual-a11y-ci (shard 2/2)', 'skipped');

  assert.equal(summarizeRequiredChecks(conclusions).allPassed, true);
});

test('a comment saying /recheck asks the gate to look again', () => {
  const trigger = findTrigger({
    context: {
      eventName: 'issue_comment',
      payload: {
        issue: { number: 12, pull_request: {} },
        comment: { body: 'fixed now, /recheck please' }
      }
    },
    env: {}
  });

  assert.deepEqual(trigger, { kind: TRIGGER_KINDS.contribution, number: 12, isRecheck: true });
});

test('the two schedules do different jobs', () => {
  const poll = findTrigger({
    context: { eventName: 'schedule', payload: { schedule: '*/30 * * * *' } },
    env: {}
  });
  const sweep = findTrigger({
    context: { eventName: 'schedule', payload: { schedule: '17 6 * * *' } },
    env: {}
  });

  assert.equal(poll.kind, TRIGGER_KINDS.poll);
  assert.equal(sweep.kind, TRIGGER_KINDS.sweep);
});

test('a finished run for a fork is traced to its pull request by branch', () => {
  const trigger = findTrigger({
    context: {
      eventName: 'workflow_run',
      payload: {
        workflow_run: {
          pull_requests: [],
          head_branch: 'fix',
          head_repository: { owner: { login: 'contributor' } }
        }
      }
    },
    env: {}
  });

  assert.deepEqual(trigger, {
    kind: TRIGGER_KINDS.workflowRun,
    headBranch: 'fix',
    headRepositoryOwner: 'contributor'
  });
});

test('the comment lists every check, with what to do under each one not yet done', () => {
  const body = renderPullRequestComment({
    checklist: [
      {
        title: 'Contribution rules',
        items: [
          createDoneItem('Linked to issue #4321'),
          createToDoItem('The description says why', 'Say what you changed.'),
          createInProgressItem('`lint` passes')
        ]
      }
    ],
    threadsAwaitingReply: [],
    deadline: {
      date: findDeadline(NOTICE_SENT_AT, 'readyPullRequest'),
      contributionKind: 'readyPullRequest'
    },
    state: { noncompliantSince: NOTICE_SENT_AT }
  });

  assert.match(body, /#### Contribution rules/);
  assert.match(
    body,
    /- ✅ Linked to issue #4321\n- ⬜ The description says why\n {2}- Say what you changed\.\n- ⏳ `lint` passes/
  );
  assert.match(body, /2026-09-08/);
  assert.match(body, /\/recheck/);
  assert.match(body, /convert this pull request to a draft/);
  assert.deepEqual(readMarker(body), { noncompliantSince: NOTICE_SENT_AT });
});

test('an issue is shown every section it needs, filled in or not', () => {
  const issue = { labels: ['type:bug'], body: '### Summary\n\nPlots drift.\n', comments: [] };
  const body = renderIssueComment({ issueItems: assessIssue(issue), state: {} });

  assert.match(body, /✅ \*\*Summary\*\* is filled in/);
  assert.match(
    body,
    /⬜ \*\*Expected vs Current Behavior\*\* is filled in\n {2}- Edit the issue description/
  );
  assert.match(body, /⬜ \*\*Steps to Reproduce\*\* is filled in/);
});

test('an unanswered AI comment is spelled out, with a link', () => {
  const body = renderPullRequestComment({
    checklist: [],
    threadsAwaitingReply: [
      {
        id: 'a',
        isResolved: true,
        path: 'src/plugins/plot/Plot.js',
        line: 42,
        url: 'https://example.test/1',
        summary: 'Consider extracting this.'
      }
    ],
    state: {}
  });

  assert.match(body, /Automated review comments still needing a reply/);
  assert.match(body, /src\/plugins\/plot\/Plot\.js:42/);
  assert.match(body, /resolved, but no reply yet/);
  assert.match(body, /no need to un-resolve/);
});
