/**
 * Tests for the rules the gate enforces. Run with:
 *
 *   node --test .github/scripts/contribution-gate/
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const fs = require('node:fs');
const path = require('node:path');

const { assessIssue, findIssueFailures, hasTestingInstructions } = require('./issueCompliance');
const { assessPullRequestRules, findPullRequestFailures } = require('./prCompliance');
const { hasFilledSection, parseSections } = require('./markdownSections');
const { AI_CHECK_RESULTS, findAiCheckResult, readAiCheckResults } = require('./aiCheckResults');
const { STATUSES } = require('./checklist');
const { AI_REQUIRED_CHECK_NAMES } = require('./config');

const REPOSITORY_ROOT = path.resolve(__dirname, '../../..');

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
  assert.deepEqual(findPullRequestFailures(buildPullRequest(), [COMPLIANT_ISSUE]), []);
});

test('the Author Checklist is one line, quoting back every item left unticked', () => {
  const pullRequest = buildPullRequest({
    body: COMPLIANT_PULL_REQUEST_BODY.replace(/\* \[x\]/g, '* [ ]')
  });
  const items = assessPullRequestRules(pullRequest, [COMPLIANT_ISSUE]).filter((item) =>
    item.label.includes('Author Checklist')
  );
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.equal(items.length, 1);
  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-checklist-unchecked']
  );
  assert.match(
    failures[0].fix,
    /`Changes address the original issue`, `Automated tests are included or updated`/
  );
});

test('a missing checklist is reported on its own', () => {
  const pullRequest = buildPullRequest({ body: '### Describe your changes:\n\nA change.\n' });
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-checklist-missing']
  );
});

test('a pull request with no linked issue is told how to link one', () => {
  const failures = findPullRequestFailures(buildPullRequest(), []);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-linked-issue-missing']
  );
  assert.match(failures[0].fix, /Closes #1234/);
});

test("with no linked issue, the issue's requirements are still listed, as not yet met", () => {
  const items = assessPullRequestRules(buildPullRequest(), []);

  assert.equal(items[1].status, STATUSES.toDo);
  assert.equal(items[1].label, 'The linked issue meets its requirements');
  assert.equal(items[1].failure, undefined, 'the missing link is the one thing to fix');
});

test('an incomplete issue is one line on the pull request, naming everything it is missing', () => {
  const incompleteIssue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift.\n' };
  const failures = findPullRequestFailures(buildPullRequest(), [incompleteIssue]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-issue-4321']
  );
  assert.equal(
    failures[0].summary,
    'Issue #4321 is missing **Expected vs Current Behavior**, **Steps to Reproduce** and testing instructions.'
  );
  assert.match(failures[0].fix, /under a `### Testing Instructions` heading/);
});

test('the issue itself lists its testing instructions, without holding the issue to them', () => {
  const issue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift.\n' };
  const testingItem = assessIssue(issue).at(-1);

  assert.match(testingItem.label, /Testing instructions/);
  assert.equal(testingItem.status, STATUSES.toDo);
  assert.equal(testingItem.failure, undefined, 'only a pull request closing the issue needs them');
});

test('the exemption label takes a pull request out of the gate entirely', () => {
  const pullRequest = buildPullRequest({ body: '', labels: ['pr:daveit'] });

  assert.deepEqual(findPullRequestFailures(pullRequest, []), []);
});

test("CodeRabbit requesting changes is a failed rule even when its comment can't be read", () => {
  const pullRequest = buildPullRequest({ aiReviewState: 'CHANGES_REQUESTED' });
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(
    failures.map((failure) => failure.id),
    ['pr-ai-review']
  );
  assert.match(failures[0].fix, /CodeRabbit's comment/);
});

test("CodeRabbit's checks are one line, failed when its comment says one failed", () => {
  const pullRequest = buildPullRequest({
    aiCheckResults: aiResults({ 'Description explains why': 'error' })
  });

  assert.deepEqual(aiCheckStatuses(pullRequest), [STATUSES.toDo]);
  assert.deepEqual(
    findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]).map((failure) => failure.id),
    ['pr-ai-review']
  );
});

test("CodeRabbit's checks are in progress until it has reported every one", () => {
  const partlyRun = buildPullRequest({
    aiCheckResults: aiResults({ 'Changed code is tested': 'passed' })
  });

  assert.deepEqual(aiCheckStatuses(buildPullRequest()), [STATUSES.inProgress]);
  assert.deepEqual(aiCheckStatuses(partlyRun), [STATUSES.inProgress]);
});

test("CodeRabbit's checks are done once all pass, before it approves", () => {
  const allPassed = Object.fromEntries(AI_REQUIRED_CHECK_NAMES.map((name) => [name, 'passed']));

  assert.deepEqual(aiCheckStatuses(buildPullRequest({ aiCheckResults: aiResults(allPassed) })), [
    STATUSES.done
  ]);
});

test("CodeRabbit's verdict wins over its table", () => {
  const allPassed = Object.fromEntries(AI_REQUIRED_CHECK_NAMES.map((name) => [name, 'passed']));
  const approvedOverOldFailure = buildPullRequest({
    aiReviewState: 'APPROVED',
    aiCheckResults: aiResults({ 'Description explains why': 'error' })
  });
  const changesRequestedOverPasses = buildPullRequest({
    aiReviewState: 'CHANGES_REQUESTED',
    aiCheckResults: aiResults(allPassed)
  });

  assert.deepEqual(aiCheckStatuses(approvedOverOldFailure), [STATUSES.done]);
  assert.deepEqual(aiCheckStatuses(changesRequestedOverPasses), [STATUSES.toDo]);
});

test('a CodeRabbit verdict not yet given, or an approval, is no failure', () => {
  for (const aiReviewState of [undefined, 'APPROVED']) {
    const pullRequest = buildPullRequest({ aiReviewState });

    assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
  }
});

test("on a closed pull request, CodeRabbit's last verdict does not count, because it reviews again on reopening", () => {
  const pullRequest = buildPullRequest({
    state: 'CLOSED',
    aiReviewState: 'CHANGES_REQUESTED',
    aiCheckResults: aiResults({ 'Description explains why': 'error' })
  });

  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

test("CodeRabbit's results are read from the table in its own comment", () => {
  const results = readAiCheckResults([
    codeRabbitComment([
      '|         Check name        |   Status   | Explanation |',
      '| :----------------------- | :--------: | :---------- |',
      '|  Description Explains Why |   ![Error](https://example.test/error.svg)   | Restates the diff. |',
      '| Changed Code Is Tested | ![Passed](https://example.test/passed.svg) | A spec covers it. |'
    ])
  ]);

  assert.equal(findAiCheckResult(results, 'Description explains why'), AI_CHECK_RESULTS.error);
  assert.equal(findAiCheckResult(results, 'Changed code is tested'), AI_CHECK_RESULTS.passed);
  assert.equal(findAiCheckResult(results, 'Verification is described'), undefined);
});

test("nobody else's comment can pass for CodeRabbit's results", () => {
  const table = '| Description Explains Why | ![Passed](https://example.test/passed.svg) | Fine. |';
  const results = readAiCheckResults([
    { body: table, user: { login: 'contributor', type: 'User' } },
    { body: table, user: { login: 'coderabbitai', type: 'User' } },
    { body: table, user: null }
  ]);

  assert.equal(results.size, 0);
});

test("the checks listed are exactly CodeRabbit's error-mode checks in .coderabbit.yaml", () => {
  const configuration = fs.readFileSync(path.join(REPOSITORY_ROOT, '.coderabbit.yaml'), 'utf8');
  const errorModeChecks = [...configuration.matchAll(/^\s*- name: (.+)\n\s*mode: error$/gm)].map(
    ([, name]) => name.trim()
  );

  assert.deepEqual(errorModeChecks, AI_REQUIRED_CHECK_NAMES);
});

function buildPullRequest(overrides = {}) {
  return {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    state: 'OPEN',
    aiReviewState: undefined,
    aiCheckResults: new Map(),
    ...overrides
  };
}

function aiResults(resultsByName) {
  return new Map(
    Object.entries(resultsByName).map(([name, result]) => [name.toLowerCase(), result])
  );
}

function aiCheckStatuses(pullRequest) {
  return assessPullRequestRules(pullRequest, [COMPLIANT_ISSUE])
    .filter((item) => item.label === "CodeRabbit's pre-merge checks pass")
    .map((item) => item.status);
}

function codeRabbitComment(lines) {
  return { body: lines.join('\n'), user: { login: 'coderabbitai[bot]', type: 'Bot' } };
}

// The templates in use today. The gate runs alongside them during its pilot, and
// pull requests mostly close issues filed under them, so it must read them.

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

test('the current pull request template is complete once every Author Checklist item is ticked', () => {
  const body = readTemplate('.github/PULL_REQUEST_TEMPLATE.md').replace(
    /(### Author Checklist[\s\S]*?)(### Reviewer Checklist)/,
    (match, checklist, next) => checklist.replace(/\* \[ \] /g, '* [x] ') + next
  );

  assert.doesNotMatch(body, /milestone|`type:` label/i, 'the template no longer asks for either');
  assert.deepEqual(findPullRequestFailures(buildPullRequest({ body }), [COMPLIANT_ISSUE]), []);
});

test('a pull request opened from the older template is not asked to tick its type label or milestone items', () => {
  const body = `${COMPLIANT_PULL_REQUEST_BODY}* [ ] Have you associated this PR with a \`type:\` label?
* [ ] Have you associated a milestone with this PR? Note: leave blank if unsure.
`;

  assert.deepEqual(findPullRequestFailures(buildPullRequest({ body }), [COMPLIANT_ISSUE]), []);
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
