/**
 * Tests for the rules the gate enforces. Run with:
 *
 *   node --test .github/scripts/contribution-gate/
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { findIssueFailures, hasTestingInstructions } = require('./issueCompliance');
const { findPullRequestFailures } = require('./prCompliance');
const { hasFilledSection, parseSections } = require('./markdownSections');

const COMPLIANT_PULL_REQUEST_BODY = `
Closes #4321

### Describe your changes:

Teaches the plot renderer to re-anchor after a zoom.

### Author Checklist

* [x] Changes address the original issue
* [x] Automated tests are included or updated
`;

const COMPLIANT_ISSUE = {
  number: 4321,
  labels: ['type:bug'],
  body: `
### Summary

Plots drift after zooming.

### Expected vs Current Behavior

They should stay anchored.

### Steps to Reproduce

1. Open a plot
2. Zoom

### Testing Instructions

Open a plot, zoom, confirm the axis stays put.
`,
  comments: []
};

test('markdownSections reads Issue Form answers', () => {
  const sections = parseSections('### Summary\n\nIt broke.\n\n### Environment\n\n_No response_\n');

  assert.equal(sections.get('summary'), 'It broke.');
  assert.equal(hasFilledSection(sections, 'Summary'), true);
  assert.equal(hasFilledSection(sections, 'Environment'), false, '_No response_ is not an answer');
  assert.equal(
    hasFilledSection(sections, 'Steps to Reproduce'),
    false,
    'a missing section is not filled in'
  );
});

test('markdownSections understands the older Markdown templates', () => {
  const sections = parseSections(
    "#### Summary\n\nIt broke.\n\n**Describe the solution you'd like**\n\nFix it.\n"
  );

  assert.equal(hasFilledSection(sections, 'Summary'), true);
  assert.equal(hasFilledSection(sections, "Describe the solution you'd like"), true);
});

test('markdownSections ignores template comments and empty list markers', () => {
  const sections = parseSections(
    '### Summary\n\n<!--- tell us what happened -->\n\n### Steps to Reproduce\n\n1.\n2.\n'
  );

  assert.equal(hasFilledSection(sections, 'Summary'), false);
  assert.equal(hasFilledSection(sections, 'Steps to Reproduce'), false);
});

test('an issue is compliant when its required sections are filled in', () => {
  assert.deepEqual(findIssueFailures(COMPLIANT_ISSUE), []);
});

test('an issue reports each missing section separately', () => {
  const issue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift after zooming.\n' };
  const failures = findIssueFailures(issue);

  assert.deepEqual(
    failures.map((failure) => failure.heading),
    ['Expected vs Current Behavior', 'Steps to Reproduce']
  );
  assert.match(failures[0].fix, /Edit the issue description/);
});

test('an untyped issue only has to have a summary', () => {
  const issue = { labels: [], body: '### Summary\n\nSomething is wrong.\n', comments: [] };

  assert.deepEqual(findIssueFailures(issue), []);
});

test('testing instructions may arrive in a comment, because authors cannot edit issues', () => {
  const issue = {
    ...COMPLIANT_ISSUE,
    body: '### Summary\n\nPlots drift.\n',
    comments: [{ body: '### Testing Instructions\n\nZoom in and watch the axis.' }]
  };

  assert.equal(hasTestingInstructions(issue), true);
});

test('an empty testing instructions comment does not count', () => {
  const issue = {
    ...COMPLIANT_ISSUE,
    body: '### Summary\n\nPlots drift.\n',
    comments: [{ body: '### Testing Instructions' }]
  };

  assert.equal(hasTestingInstructions(issue), false);
});

test('a complete pull request has nothing to report', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: []
  };

  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

test('unticked checklist items are quoted back to the author', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY.replace(
      '* [x] Changes address the original issue',
      '* [ ] Changes address the original issue'
    ),
    labels: []
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-checklist-unchecked']
  );
  assert.match(failures[0].summary, /`Changes address the original issue`/);
});

test('a missing checklist is reported on its own', () => {
  const pullRequest = {
    body: '### Describe your changes:\n\nA change.\n',
    labels: []
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-checklist-missing']
  );
});

test('a pull request with no linked issue is told how to link one', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: []
  };
  const failures = findPullRequestFailures(pullRequest, []);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-linked-issue-missing']
  );
  assert.match(failures[0].fix, /Closes #1234/);
});

test('problems with the linked issue are reported against the issue', () => {
  const incompleteIssue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift.\n' };
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: []
  };
  const failures = findPullRequestFailures(pullRequest, [incompleteIssue]);

  assert.equal(failures.length, 3, 'two missing sections plus the testing instructions');
  assert.match(failures[0].summary, /Issue #4321/);
  assert.match(failures.at(-1).fix, /comment on it with a `### Testing Instructions` heading/);
});

test('the exemption label takes a pull request out of the gate entirely', () => {
  const pullRequest = { body: '', labels: ['pr:daveit'] };

  assert.deepEqual(findPullRequestFailures(pullRequest, []), []);
});

test('CodeRabbit requesting changes is a rule the pull request fails', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    state: 'OPEN',
    aiReviewState: 'CHANGES_REQUESTED'
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-ai-review']
  );
  assert.match(failures[0].fix, /CodeRabbit's comment/);
});

test('a CodeRabbit verdict not yet given, or an approval, is no failure', () => {
  for (const aiReviewState of [undefined, 'APPROVED']) {
    const pullRequest = {
      body: COMPLIANT_PULL_REQUEST_BODY,
      labels: [],
      state: 'OPEN',
      aiReviewState
    };

    assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
  }
});

test("on a closed pull request, CodeRabbit's last verdict does not count, because it reviews again on reopening", () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    state: 'CLOSED',
    aiReviewState: 'CHANGES_REQUESTED'
  };

  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

// The templates in use today. The gate runs alongside them during its pilot, and
// pull requests mostly close issues filed under them, so it must read them.
const fs = require('node:fs');
const path = require('node:path');

const REPOSITORY_ROOT = path.resolve(__dirname, '../../..');

function readTemplate(relativePath) {
  return fs
    .readFileSync(path.join(REPOSITORY_ROOT, relativePath), 'utf8')
    .replace(/^---[\s\S]*?---\n/, '');
}

function fillIn(template, answers) {
  return Object.entries(answers).reduce(
    (body, [heading, answer]) => body.replace(new RegExp(`(${heading}[^\n]*\n)`), `$1${answer}\n`),
    template
  );
}

test('a bug filed under the current template is complete once it is filled in', () => {
  const body = fillIn(readTemplate('.github/ISSUE_TEMPLATE/bug_report.md'), {
    '#### Summary': 'Plots drift after zooming.',
    '#### Expected vs Current Behavior': 'They should stay anchored.',
    '#### Steps to Reproduce': '1. Open a plot\n2. Zoom'
  });

  assert.deepEqual(findIssueFailures({ body, labels: ['type:bug'] }), []);
});

test('a bug filed under the current template, left unfilled, is incomplete', () => {
  const body = readTemplate('.github/ISSUE_TEMPLATE/bug_report.md');
  const failures = findIssueFailures({ body, labels: ['type:bug'] });

  assert.deepEqual(
    failures.map((failure) => failure.heading),
    ['Summary', 'Expected vs Current Behavior', 'Steps to Reproduce']
  );
});

test('an enhancement filed under the current template is read by its own headings', () => {
  const body = readTemplate('.github/ISSUE_TEMPLATE/enhancement-request.md');

  assert.deepEqual(findIssueFailures({ body, labels: ['type:enhancement'] }), []);
});

test('the current pull request template never asks for the type label or milestone the gate sets itself', () => {
  const template = readTemplate('.github/PULL_REQUEST_TEMPLATE.md');
  const body = template
    .replace(
      /### Describe your changes:\n/,
      '### Describe your changes:\nRe-anchors the plot after a zoom.\n'
    )
    .replace(
      /(### Author Checklist[\s\S]*?)(### Reviewer Checklist)/,
      (match, checklist, next) =>
        checklist.replace(/\* \[ \] (?!.*(milestone|`type:` label))/g, '* [x] ') + next
    );
  const pullRequest = { body, labels: [] };

  assert.match(
    body,
    /\* \[ \] Have you associated a milestone/,
    'the milestone item really is left unticked'
  );
  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

test('markdownSections drops nested, back-to-back and unclosed comments', () => {
  const sections = parseSections(
    '### Summary\n\n<!-<!-- x -->-> <!-- a --><!-- b -->\n\n### Steps to Reproduce\n\n<!-- never closed\n1. Do it\n'
  );

  assert.equal(
    hasFilledSection(sections, 'Steps to Reproduce'),
    false,
    'an unclosed comment runs to the end'
  );
});
