/**
 * Decides whether a pull request meets the contribution rules.
 *
 * Every rule returns feedback the author can act on without help from a
 * maintainer, and no rule asks for something an outside contributor lacks the
 * permission to do.
 */

const { GATE_EXEMPT_LABEL, TEST_EXEMPT_FILE_PATTERNS, TEST_FILE_PATTERNS } = require('./config');
const { matchesAnyPattern } = require('./globMatch');
const { hasFilledSection, parseSections } = require('./markdownSections');
const { findIssueFailures, hasTestingInstructions } = require('./issueCompliance');

const DESCRIPTION_HEADING = 'Describe your changes';
const AUTHOR_CHECKLIST_HEADING = 'Author Checklist';
const UNCHECKED_ITEM_PATTERN = /^\s*[-*]\s*\[ \]\s*(.+?)\s*$/gm;

/**
 * @param {object} pullRequest body, labels and changedFiles of the pull request
 * @param {object[]} linkedIssues the issues the pull request closes, each with
 * body, labels and comments
 * @returns {{id: string, summary: string, fix: string}[]}
 */
function findPullRequestFailures(pullRequest, linkedIssues) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return [];
  }

  return [
    ...findDescriptionFailures(pullRequest.body),
    ...findChecklistFailures(pullRequest.body),
    ...findLinkedIssueFailures(linkedIssues),
    ...findAutomatedTestFailures(pullRequest.changedFiles)
  ];
}

function findDescriptionFailures(body) {
  const sections = parseSections(body);

  if (hasFilledSection(sections, DESCRIPTION_HEADING)) {
    return [];
  }

  return [
    {
      id: 'pr-description',
      summary: `The **${DESCRIPTION_HEADING}** section is empty.`,
      fix: 'Edit the pull request description and say what you changed and why.'
    }
  ];
}

function findChecklistFailures(body) {
  const sections = parseSections(body);
  const checklist = sections.get('author checklist');

  if (checklist === undefined) {
    return [
      {
        id: 'pr-checklist-missing',
        summary: 'The **Author Checklist** is missing.',
        fix: 'Restore the checklist from the pull request template and tick every item.'
      }
    ];
  }

  return describeUncheckedItems(readUncheckedItems(checklist));
}

function findLinkedIssueFailures(linkedIssues) {
  if (linkedIssues.length === 0) {
    return [
      {
        id: 'pr-linked-issue-missing',
        summary: 'This pull request is not linked to an issue.',
        fix: 'Add a line such as `Closes #1234` to the description, so the issue closes on merge.'
      }
    ];
  }

  return linkedIssues.flatMap(describeIssueProblems);
}

function findAutomatedTestFailures(changedFiles) {
  if (isExemptFromTests(changedFiles)) {
    return [];
  }

  if (changedFiles.some((filePath) => matchesAnyPattern(filePath, TEST_FILE_PATTERNS))) {
    return [];
  }

  return [
    {
      id: 'pr-automated-tests',
      summary: 'No automated test was added or updated.',
      fix: 'Add a Playwright end-to-end test under `e2e/`, or update an existing `*Spec.js`. If a test is genuinely impossible here, say why in the description and ask a maintainer for the `pr:daveit` label.'
    }
  ];
}

function describeIssueProblems(issue) {
  const problems = findIssueFailures(issue).map((failure) => ({
    id: `pr-issue-${issue.number}-${failure.id}`,
    summary: `Issue #${issue.number}: ${failure.summary}`,
    fix: `Fill in **${failure.heading}** on issue #${issue.number}. If you cannot edit that issue, add the information in a comment on it instead.`
  }));

  if (hasTestingInstructions(issue)) {
    return problems;
  }

  return [
    ...problems,
    {
      id: `pr-issue-${issue.number}-testing-instructions`,
      summary: `Issue #${issue.number} has no testing instructions.`,
      fix: `Add a **Testing Instructions** section to issue #${issue.number}, or comment on it with a \`### Testing Instructions\` heading followed by the steps a reviewer should follow.`
    }
  ];
}

function describeUncheckedItems(uncheckedItems) {
  if (uncheckedItems.length === 0) {
    return [];
  }

  return [
    {
      id: 'pr-checklist-unchecked',
      summary: `${uncheckedItems.length} item(s) in the **Author Checklist** are not ticked: ${quoteItems(uncheckedItems)}.`,
      fix: 'Do each of those things, then tick the boxes in the description.'
    }
  ];
}

function readUncheckedItems(checklist) {
  const items = [...checklist.matchAll(UNCHECKED_ITEM_PATTERN)];

  return items.map((item) => stripMarkdownLinks(item[1]));
}

function isExemptFromTests(changedFiles) {
  if (changedFiles.length === 0) {
    return true;
  }

  return changedFiles.every((filePath) => matchesAnyPattern(filePath, TEST_EXEMPT_FILE_PATTERNS));
}

function quoteItems(items) {
  return items.map((item) => `"${item}"`).join(', ');
}

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

module.exports = { findPullRequestFailures };
