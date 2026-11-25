/**
 * Decides whether an issue meets the contribution rules, and where a pull
 * request may look for the testing instructions its issue is required to carry.
 */

const { REQUIRED_ISSUE_SECTIONS, TESTING_INSTRUCTION_HEADINGS } = require('./config');
const { hasFilledSection, parseSections } = require('./markdownSections');
const {
  createDoneItem,
  createFailedRuleItem,
  createToDoItem,
  listFailures
} = require('./checklist');

const UNTYPED_SECTION_KEY = 'untyped';
const TESTING_INSTRUCTIONS_REQUIREMENT = 'testing instructions';

/**
 * Everything an issue needs, each as a checklist item naming its requirement.
 * Testing instructions are listed, but are not a rule the issue fails: only a
 * pull request that closes it needs them.
 *
 * @param {{body: string, labels: string[], comments: {body: string}[]}} issue
 * @returns {object[]} in the order they should be shown to the author
 */
function assessIssue(issue) {
  return [...assessIssueSections(issue), assessTestingInstructions(issue)];
}

/** @returns {object[]} a checklist item for each section the issue's type requires */
function assessIssueSections(issue) {
  const sections = parseSections(issue.body);
  const requiredHeadings = findRequiredHeadings(issue.labels);

  return requiredHeadings.map((alternatives) => assessSection(sections, alternatives));
}

/**
 * @param {{body: string, labels: string[]}} issue
 * @returns {{id: string, heading: string, summary: string, fix: string}[]} one
 * entry per section the issue is missing
 */
function findIssueFailures(issue) {
  return listFailures(assessIssueSections(issue));
}

/**
 * Testing instructions may be in the issue body, or added later in a comment,
 * because the author of a fix often cannot edit someone else's issue.
 *
 * @param {{body: string, comments: {body: string}[]}} issue
 * @returns {boolean}
 */
function hasTestingInstructions(issue) {
  if (hasTestingInstructionSection(issue.body)) {
    return true;
  }

  return issue.comments.some((comment) => hasTestingInstructionSection(comment.body));
}

/** Any of a section's alternative headings will do; the first is the one named. */
function assessSection(sections, alternatives) {
  const heading = alternatives[0];
  const label = `**${heading}** is filled in`;
  const requirement = `**${heading}**`;

  if (hasAnyFilledSection(sections, alternatives)) {
    return { ...createDoneItem(label), requirement };
  }

  return { ...createFailedRuleItem(label, describeMissingSection(heading)), requirement };
}

function assessTestingInstructions(issue) {
  const label = 'Testing instructions, which a pull request that closes this issue needs';
  const requirement = TESTING_INSTRUCTIONS_REQUIREMENT;

  if (hasTestingInstructions(issue)) {
    return { ...createDoneItem(label), requirement };
  }

  const fix =
    'Add a **Testing Instructions** section, or a comment with a `### Testing Instructions` heading followed by the steps a reviewer should follow.';

  return { ...createToDoItem(label, fix), requirement };
}

/** @returns {string[][]} each required section, as the headings that satisfy it */
function findRequiredHeadings(labels) {
  const typeLabel = labels.find((label) => REQUIRED_ISSUE_SECTIONS[label] !== undefined);
  const requiredSections = REQUIRED_ISSUE_SECTIONS[typeLabel ?? UNTYPED_SECTION_KEY];

  return requiredSections.map(toAlternatives);
}

function toAlternatives(requiredSection) {
  if (Array.isArray(requiredSection)) {
    return requiredSection;
  }

  return [requiredSection];
}

function hasAnyFilledSection(sections, headings) {
  return headings.some((heading) => hasFilledSection(sections, heading));
}

function hasTestingInstructionSection(body) {
  const sections = parseSections(body);

  return TESTING_INSTRUCTION_HEADINGS.some((heading) => hasFilledSection(sections, heading));
}

function describeMissingSection(heading) {
  return {
    id: `issue-section:${heading}`,
    heading,
    summary: `The **${heading}** section is empty or missing.`,
    fix: `Edit the issue description and fill in **${heading}**.`
  };
}

module.exports = { assessIssue, findIssueFailures, hasTestingInstructions };
