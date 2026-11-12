/**
 * Decides whether a pull request meets the contribution rules.
 *
 * Every rule returns feedback the author can act on without help from a
 * maintainer, and no rule asks for something an outside contributor lacks the
 * permission to do.
 *
 * The rules that need judgement, such as whether the description explains why
 * and whether a test covers the change, are CodeRabbit's pre-merge checks. The
 * gate reads their outcome from CodeRabbit's review.
 */

const { CHECKLIST_ITEMS_HANDLED_BY_THE_GATE, GATE_EXEMPT_LABEL } = require('./config');
const { normalizeHeading, parseSections } = require('./markdownSections');
const { findIssueFailures, hasTestingInstructions } = require('./issueCompliance');
const { quoteContributorText } = require('./quotedText');

const AUTHOR_CHECKLIST_HEADING = 'Author Checklist';
const UNCHECKED_ITEM_PATTERN = /^\s*[-*]\s*\[ \]\s*(.+?)\s*$/gm;
const CLOSED_STATE = 'CLOSED';
const CHANGES_REQUESTED = 'CHANGES_REQUESTED';

/**
 * @param {object} pullRequest body, labels, state and aiReviewState of the pull request
 * @param {object[]} linkedIssues the issues the pull request closes, each with
 * body, labels and comments
 * @returns {{id: string, summary: string, fix: string}[]}
 */
function findPullRequestFailures(pullRequest, linkedIssues) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return [];
  }

  return [
    ...findChecklistFailures(pullRequest.body),
    ...findLinkedIssueFailures(linkedIssues),
    ...findAiReviewFailures(pullRequest)
  ];
}

/**
 * CodeRabbit does not review a closed pull request, so on one its verdict is
 * from before the contributor's latest fixes. It does not stand in the way of
 * reopening: once the pull request is open again, CodeRabbit reviews it again.
 */
function findAiReviewFailures(pullRequest) {
  if (pullRequest.state === CLOSED_STATE || pullRequest.aiReviewState !== CHANGES_REQUESTED) {
    return [];
  }

  return [
    {
      id: 'pr-ai-review',
      summary: "CodeRabbit's pre-merge checks found something to fix.",
      fix: "CodeRabbit's comment on this pull request lists each check that failed and how to resolve it. Fix those, push, and CodeRabbit checks again. If you think a check is wrong, reply to CodeRabbit's comment to say why, so a maintainer can see it."
    }
  ];
}

function findChecklistFailures(body) {
  const sections = parseSections(body);
  const checklist = sections.get(normalizeHeading(AUTHOR_CHECKLIST_HEADING));

  if (checklist === undefined) {
    return [
      {
        id: 'pr-checklist-missing',
        summary: 'The **Author Checklist** is missing.',
        fix: 'Restore the checklist from the pull request template and tick every item.'
      }
    ];
  }

  const uncheckedItems = readUncheckedItems(checklist).filter((item) => !isHandledByTheGate(item));

  return describeUncheckedItems(uncheckedItems);
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

function isHandledByTheGate(checklistItem) {
  return CHECKLIST_ITEMS_HANDLED_BY_THE_GATE.some((pattern) => pattern.test(checklistItem));
}

function quoteItems(items) {
  return items.map(quoteContributorText).join(', ');
}

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

module.exports = { findPullRequestFailures };
