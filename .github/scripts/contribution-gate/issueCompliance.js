/**
 * Decides whether an issue meets the contribution rules, and where a pull
 * request may look for the testing instructions its issue is required to carry.
 */

const { REQUIRED_ISSUE_SECTIONS, TESTING_INSTRUCTION_HEADINGS } = require('./config');
const { hasFilledSection, parseSections } = require('./markdownSections');

const UNTYPED_SECTION_KEY = 'untyped';

/**
 * @param {{body: string, labels: string[]}} issue
 * @returns {{id: string, summary: string, fix: string}[]} one entry per rule the
 * issue fails, in the order they should be shown to the author
 */
function findIssueFailures(issue) {
  const sections = parseSections(issue.body);
  const requiredHeadings = findRequiredHeadings(issue.labels);
  const missingHeadings = requiredHeadings.filter((heading) => !hasFilledSection(sections, heading));

  return missingHeadings.map(describeMissingSection);
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

function findRequiredHeadings(labels) {
  const typeLabel = labels.find((label) => REQUIRED_ISSUE_SECTIONS[label] !== undefined);

  if (typeLabel === undefined) {
    return REQUIRED_ISSUE_SECTIONS[UNTYPED_SECTION_KEY];
  }

  return REQUIRED_ISSUE_SECTIONS[typeLabel];
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

module.exports = { findIssueFailures, hasTestingInstructions };
