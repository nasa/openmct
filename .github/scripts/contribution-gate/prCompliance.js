/**
 * Decides whether a pull request meets the contribution rules.
 *
 * Every rule returns feedback the author can act on without help from a
 * maintainer, and no rule asks for something an outside contributor lacks the
 * permission to do.
 *
 * The rules that need judgement, such as whether the issue explains why the
 * change is needed and whether a test covers it, are CodeRabbit's pre-merge
 * checks. The gate reads their outcome from CodeRabbit's summary comment and its
 * review.
 */

const fs = require('node:fs');
const path = require('node:path');

const { AI_REQUIRED_CHECK_NAMES, GATE_EXEMPT_LABEL, RETIRED_CHECKLIST_ITEMS } = require('./config');
const { AI_CHECK_RESULTS, findAiCheckResult } = require('./aiCheckResults');
const {
  createDoneItem,
  createFailedRuleItem,
  createInProgressItem,
  createToDoItem,
  isToDo,
  listFailures
} = require('./checklist');
const { normalizeHeading, parseSections } = require('./markdownSections');
const { assessIssue } = require('./issueCompliance');
const { quoteContributorText } = require('./quotedText');

const AUTHOR_CHECKLIST_HEADING = 'Author Checklist';
const CHECKLIST_ITEM_PATTERN = /^\s*[-*]\s*\[([ xX])\]\s*(.+?)\s*$/gm;
const UNTICKED_BOX = ' ';
const CLOSED_STATE = 'CLOSED';
const APPROVED = 'APPROVED';

/**
 * Read from the gate's own checkout, which is master's, so a pull request
 * cannot change what its own checklist must contain.
 */
const TEMPLATE_PATH = path.resolve(__dirname, '../../PULL_REQUEST_TEMPLATE.md');
const REQUIRED_CHECKLIST_ITEMS = readTemplateChecklistItems();

const LINKED_ISSUE_LABEL =
  'Linked to an issue, by a line such as `Closes #1234` in the description';
const AI_CHECKS_LABEL = "CodeRabbit's pre-merge checks pass";
const AI_CHECKS_FAILURE = {
  id: 'pr-ai-review',
  summary: "CodeRabbit's pre-merge checks found something to fix.",
  fix: "CodeRabbit's comment on this pull request lists each check that failed and how to resolve it. Fix those, push, and CodeRabbit checks again. If you think a check is wrong, reply to CodeRabbit's comment to say why, so a maintainer can see it."
};

/**
 * @param {object} pullRequest body, labels, state, aiReviewState and
 * aiCheckResults of the pull request
 * @param {object[]} linkedIssues the issues the pull request closes, each with
 * body, labels and comments
 * @returns {object[]} a checklist item for every contribution rule, met or not
 */
function assessPullRequestRules(pullRequest, linkedIssues) {
  return [
    ...assessLinkedIssues(linkedIssues),
    ...assessAuthorChecklist(pullRequest.body),
    ...assessAiChecks(pullRequest)
  ];
}

/**
 * @returns {{id: string, summary: string, fix: string}[]} the rules the pull
 * request fails
 */
function findPullRequestFailures(pullRequest, linkedIssues) {
  if (pullRequest.labels.includes(GATE_EXEMPT_LABEL)) {
    return [];
  }

  return listFailures(assessPullRequestRules(pullRequest, linkedIssues));
}

function assessLinkedIssues(linkedIssues) {
  if (linkedIssues.length === 0) {
    return [
      createFailedRuleItem(LINKED_ISSUE_LABEL, {
        id: 'pr-linked-issue-missing',
        summary: 'This pull request is not linked to an issue.',
        fix: 'Add a line such as `Closes #1234` to the description, so the issue closes on merge.'
      }),
      createToDoItem('The linked issue meets its requirements')
    ];
  }

  return linkedIssues.flatMap(assessLinkedIssue);
}

/**
 * The issue's own checklist, on the issue, says what each requirement is; the
 * pull request needs only one line for it, naming what is missing.
 */
function assessLinkedIssue(issue) {
  const label = `Issue #${issue.number} meets its requirements`;
  const missing = assessIssue(issue)
    .filter(isToDo)
    .map((item) => item.requirement);
  const linkItem = createDoneItem(`Linked to issue #${issue.number}`);

  if (missing.length === 0) {
    return [linkItem, createDoneItem(label)];
  }

  return [
    linkItem,
    createFailedRuleItem(label, {
      id: `pr-issue-${issue.number}`,
      summary: `Issue #${issue.number} is missing ${joinWithAnd(missing)}.`,
      fix: `Add ${joinWithAnd(missing)} to issue #${issue.number}. Testing instructions can go in a comment on the issue, under a \`### Testing Instructions\` heading, if you cannot edit it.`
    })
  ];
}

function assessAuthorChecklist(body) {
  const label = '**Author Checklist** completed';
  const checklist = parseSections(body).get(normalizeHeading(AUTHOR_CHECKLIST_HEADING));

  if (checklist === undefined) {
    return [
      createFailedRuleItem(label, {
        id: 'pr-checklist-missing',
        summary: 'The **Author Checklist** is missing.',
        fix: 'Restore the checklist from the pull request template and tick every item.'
      })
    ];
  }

  return [assessOutstandingItems(label, findOutstandingItems(checklist))];
}

function assessOutstandingItems(label, outstandingItems) {
  if (outstandingItems.length === 0) {
    return createDoneItem(label);
  }

  const quotedItems = outstandingItems.map(quoteContributorText).join(', ');

  return createFailedRuleItem(label, {
    id: 'pr-checklist-unchecked',
    summary: `${outstandingItems.length} item(s) in the **Author Checklist** are not ticked: ${quotedItems}.`,
    fix: `Not ticked yet: ${quotedItems}. Tick each one in the description once you have done what it asks, restoring any from the pull request template that are missing.`
  });
}

/**
 * One line for all of CodeRabbit's pre-merge checks; its comment says which
 * failed and why. The results in that comment decide, since CodeRabbit's
 * verdict cannot: it requests changes for any blocking review comment, not only
 * a failed check, and approves only once its comments are answered as well. An
 * approval still means every check passed.
 *
 * On a closed pull request a failure is shown, but is not counted against it:
 * CodeRabbit does not review a closed pull request, so the result is from
 * before the contributor's latest fixes, and it reviews again on reopening.
 */
function assessAiChecks(pullRequest) {
  const results = AI_REQUIRED_CHECK_NAMES.map((checkName) =>
    findAiCheckResult(pullRequest.aiCheckResults, checkName)
  );
  const hasPassed = results.every((result) => result === AI_CHECK_RESULTS.passed);
  const hasFailed = results.some(
    (result) => result !== undefined && result !== AI_CHECK_RESULTS.passed
  );

  if (pullRequest.aiReviewState === APPROVED || hasPassed) {
    return [createDoneItem(AI_CHECKS_LABEL)];
  }

  if (hasFailed === false) {
    return [createInProgressItem(AI_CHECKS_LABEL)];
  }

  if (pullRequest.state === CLOSED_STATE) {
    return [createToDoItem(AI_CHECKS_LABEL, AI_CHECKS_FAILURE.fix)];
  }

  return [createFailedRuleItem(AI_CHECKS_LABEL, AI_CHECKS_FAILURE)];
}

/**
 * Every item the template's checklist has must be there and ticked, so deleting
 * an item does not remove its requirement. An item the author added and left
 * unticked is outstanding too. Items the template no longer has are not.
 *
 * @returns {string[]}
 */
function findOutstandingItems(checklist) {
  const items = readChecklistItems(checklist).filter((item) => isRetired(item.text) === false);
  const tickedItems = new Set(
    items.filter((item) => item.isTicked).map((item) => toComparable(item.text))
  );
  const templateItems = new Set(REQUIRED_CHECKLIST_ITEMS.map(toComparable));
  const missingOrUnticked = REQUIRED_CHECKLIST_ITEMS.filter(
    (text) => tickedItems.has(toComparable(text)) === false
  );
  const otherUnticked = items
    .filter(
      (item) => item.isTicked === false && templateItems.has(toComparable(item.text)) === false
    )
    .map((item) => item.text);

  return [...missingOrUnticked, ...otherUnticked];
}

/** @returns {{text: string, isTicked: boolean}[]} */
function readChecklistItems(checklist) {
  return [...checklist.matchAll(CHECKLIST_ITEM_PATTERN)].map(([, box, text]) => ({
    text: stripMarkdownLinks(text),
    isTicked: box !== UNTICKED_BOX
  }));
}

/** @returns {string[]} the texts of the template's Author Checklist items */
function readTemplateChecklistItems() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const checklist = parseSections(template).get(normalizeHeading(AUTHOR_CHECKLIST_HEADING));

  return readChecklistItems(checklist).map((item) => item.text);
}

/** Case and spacing may differ from the template's; the words may not. */
function toComparable(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function joinWithAnd(items) {
  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function isRetired(checklistItemText) {
  return RETIRED_CHECKLIST_ITEMS.some((pattern) => pattern.test(checklistItemText));
}

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

module.exports = { assessPullRequestRules, findPullRequestFailures };
