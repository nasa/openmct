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
const { matchesAnyPattern } = require('./globMatch');

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
  assert.equal(hasFilledSection(sections, 'Steps to Reproduce'), false, 'a missing section is not filled in');
});

test('markdownSections understands the older Markdown templates', () => {
  const sections = parseSections('#### Summary\n\nIt broke.\n\n**Describe the solution you\'d like**\n\nFix it.\n');

  assert.equal(hasFilledSection(sections, 'Summary'), true);
  assert.equal(hasFilledSection(sections, "Describe the solution you'd like"), true);
});

test('markdownSections ignores template comments and empty list markers', () => {
  const sections = parseSections('### Summary\n\n<!--- tell us what happened -->\n\n### Steps to Reproduce\n\n1.\n2.\n');

  assert.equal(hasFilledSection(sections, 'Summary'), false);
  assert.equal(hasFilledSection(sections, 'Steps to Reproduce'), false);
});

test('an issue is compliant when its required sections are filled in', () => {
  assert.deepEqual(findIssueFailures(COMPLIANT_ISSUE), []);
});

test('an issue reports each missing section separately', () => {
  const issue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift after zooming.\n' };
  const failures = findIssueFailures(issue);

  assert.deepEqual(failures.map((failure) => failure.heading), [
    'Expected vs Current Behavior',
    'Steps to Reproduce',
    'Testing Instructions'
  ]);
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
  const issue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift.\n', comments: [{ body: '### Testing Instructions' }] };

  assert.equal(hasTestingInstructions(issue), false);
});

test('a complete pull request has nothing to report', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    changedFiles: ['src/plugins/plot/Plot.js', 'e2e/tests/plot.e2e.spec.js']
  };

  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

test('an empty description is reported', () => {
  const pullRequest = {
    body: '### Describe your changes:\n\n<!--- tell us what you did -->\n\n### Author Checklist\n\n* [x] Done\n',
    labels: [],
    changedFiles: ['src/a.js', 'src/aSpec.js']
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(failures.map((failure) => failure.id), ['pr-description']);
});

test('unticked checklist items are quoted back to the author', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY.replace('* [x] Changes address the original issue', '* [ ] Changes address the original issue'),
    labels: [],
    changedFiles: ['src/a.js', 'src/aSpec.js']
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(failures.map((failure) => failure.id), ['pr-checklist-unchecked']);
  assert.match(failures[0].summary, /"Changes address the original issue"/);
});

test('a missing checklist is reported on its own', () => {
  const pullRequest = {
    body: '### Describe your changes:\n\nA change.\n',
    labels: [],
    changedFiles: ['src/a.js', 'src/aSpec.js']
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(failures.map((failure) => failure.id), ['pr-checklist-missing']);
});

test('a pull request with no linked issue is told how to link one', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    changedFiles: ['src/a.js', 'src/aSpec.js']
  };
  const failures = findPullRequestFailures(pullRequest, []);

  assert.deepEqual(failures.map((failure) => failure.id), ['pr-linked-issue-missing']);
  assert.match(failures[0].fix, /Closes #1234/);
});

test('problems with the linked issue are reported against the issue', () => {
  const incompleteIssue = { ...COMPLIANT_ISSUE, body: '### Summary\n\nPlots drift.\n' };
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    changedFiles: ['src/a.js', 'src/aSpec.js']
  };
  const failures = findPullRequestFailures(pullRequest, [incompleteIssue]);

  assert.equal(failures.length, 4, 'three missing sections plus the testing instructions');
  assert.match(failures[0].summary, /Issue #4321/);
  assert.match(failures.at(-1).fix, /comment on it with a `### Testing Instructions` heading/);
});

test('a pull request with no test is told what to add', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    changedFiles: ['src/plugins/plot/Plot.js']
  };
  const failures = findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]);

  assert.deepEqual(failures.map((failure) => failure.id), ['pr-automated-tests']);
});

test('documentation-only changes do not need a test', () => {
  const pullRequest = {
    body: COMPLIANT_PULL_REQUEST_BODY,
    labels: [],
    changedFiles: ['README.md', '.github/workflows/pr.yml']
  };

  assert.deepEqual(findPullRequestFailures(pullRequest, [COMPLIANT_ISSUE]), []);
});

test('the exemption label takes a pull request out of the gate entirely', () => {
  const pullRequest = { body: '', labels: ['pr:daveit'], changedFiles: ['package.json'] };

  assert.deepEqual(findPullRequestFailures(pullRequest, []), []);
});

test('glob matching spans directories only where asked', () => {
  assert.equal(matchesAnyPattern('src/plugins/plot/PlotSpec.js', ['**/*Spec.js']), true);
  assert.equal(matchesAnyPattern('PlotSpec.js', ['**/*Spec.js']), true);
  assert.equal(matchesAnyPattern('e2e/tests/functional/plot.e2e.spec.js', ['e2e/**/*.spec.js']), true);
  assert.equal(matchesAnyPattern('src/deep/thing.json', ['*.json']), false, '*.json is the repository root only');
  assert.equal(matchesAnyPattern('package.json', ['*.json']), true);
  assert.equal(matchesAnyPattern('.github/workflows/pr.yml', ['.github/**']), true);
});
