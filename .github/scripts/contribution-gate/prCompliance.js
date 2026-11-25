/**
 * Decides whether a pull request meets the contribution rules.
 *
 * Every rule returns feedback the author can act on without help from a
 * maintainer, and no rule asks for something an outside contributor lacks the
 * permission to do.
 *
 * The rules that need judgement, such as whether the description explains why
 * and whether a test covers the change, are CodeRabbit's pre-merge checks. The
 * gate reads their outcome from CodeRabbit's summary comment and its review.
 */

const {
  AI_REQUIRED_CHECK_NAMES,
  CHECKLIST_ITEMS_HANDLED_BY_THE_GATE,
  GATE_EXEMPT_LABEL
} = require('./config');
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
const UNCHECKED_ITEM_PATTERN = /^\s*[-*]\s*\[ \]\s*(.+?)\s*$/gm;
const CLOSED_STATE = 'CLOSED';
const APPROVED = 'APPROVED';
const CHANGES_REQUESTED = 'CHANGES_REQUESTED';

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

  return [assessUncheckedItems(label, readUncheckedItems(checklist))];
}

function assessUncheckedItems(label, uncheckedItems) {
  if (uncheckedItems.length === 0) {
    return createDoneItem(label);
  }

  const quotedItems = uncheckedItems.map(quoteContributorText).join(', ');

  return createFailedRuleItem(label, {
    id: 'pr-checklist-unchecked',
    summary: `${uncheckedItems.length} item(s) in the **Author Checklist** are not ticked: ${quotedItems}.`,
    fix: `Not ticked yet: ${quotedItems}. Tick each one in the description once you have done what it asks.`
  });
}

/**
 * One line for all of CodeRabbit's pre-merge checks; its comment says which
 * failed and why. Its verdict decides where it has given one: an approval means
 * every check passed, and changes requested means one failed. Until then, the
 * results in its comment say whether they have all passed, which they can
 * before it approves, since it also waits for its comments to be answered.
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
  const hasFailed =
    pullRequest.aiReviewState === CHANGES_REQUESTED ||
    results.some((result) => result !== undefined && result !== AI_CHECK_RESULTS.passed);

  if (pullRequest.aiReviewState === APPROVED || (hasPassed && hasFailed === false)) {
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

/** The items left unticked, other than those the gate takes care of itself. */
function readUncheckedItems(checklist) {
  return [...checklist.matchAll(UNCHECKED_ITEM_PATTERN)]
    .map(([, text]) => stripMarkdownLinks(text))
    .filter((text) => isHandledByTheGate(text) === false);
}

function joinWithAnd(items) {
  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function isHandledByTheGate(checklistItemText) {
  return CHECKLIST_ITEMS_HANDLED_BY_THE_GATE.some((pattern) => pattern.test(checklistItemText));
}

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

module.exports = { assessPullRequestRules, findPullRequestFailures };
