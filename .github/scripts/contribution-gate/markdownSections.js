/**
 * Reads the sections out of an issue or pull request body.
 *
 * Issue Forms render as `### <field label>` followed by the answer, with
 * `_No response_` in place of an empty optional field. Issues filed under the
 * older Markdown templates used `####` headings or bold lines instead, so both
 * shapes are understood.
 */

const HEADING_PATTERN = /^\s{0,3}#{1,6}\s+(.+?)\s*$/;
const BOLD_HEADING_PATTERN = /^\s{0,3}\*\*(.+?)\*\*:?\s*$/;
const NO_RESPONSE_PLACEHOLDER = '_no response_';
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/**
 * @param {string} body
 * @returns {Map<string, string>} section content, keyed by normalized heading
 */
function parseSections(body) {
  const sections = new Map();
  const lines = withoutHtmlComments(body).split('\n');
  let currentHeading;
  let currentLines = [];

  lines.forEach((line) => {
    const heading = readHeading(line);

    if (heading === undefined) {
      currentLines.push(line);

      return;
    }

    storeSection(sections, currentHeading, currentLines);
    currentHeading = heading;
    currentLines = [];
  });

  storeSection(sections, currentHeading, currentLines);

  return sections;
}

/**
 * @returns {boolean} true when the named section exists and the contributor
 * actually filled it in
 */
function hasFilledSection(sections, heading) {
  const content = sections.get(normalizeHeading(heading));

  if (content === undefined) {
    return false;
  }

  return isMeaningfulContent(content);
}

function normalizeHeading(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readHeading(line) {
  const headingMatch = line.match(HEADING_PATTERN) ?? line.match(BOLD_HEADING_PATTERN);

  if (headingMatch === null || headingMatch === undefined) {
    return undefined;
  }

  return headingMatch[1];
}

function storeSection(sections, heading, contentLines) {
  if (heading === undefined) {
    return;
  }

  sections.set(normalizeHeading(heading), contentLines.join('\n').trim());
}

function isMeaningfulContent(content) {
  const withoutChecklistBoxes = content.replace(/^\s*[-*]\s*\[[ xX]\]\s*/gm, '');
  const withoutListMarkers = withoutChecklistBoxes.replace(/^\s*(?:[-*]|\d+\.)\s*$/gm, '');
  const remaining = withoutListMarkers.trim();

  if (remaining.length === 0) {
    return false;
  }

  return remaining.toLowerCase() !== NO_RESPONSE_PLACEHOLDER;
}

function withoutHtmlComments(body) {
  if (body === undefined || body === null) {
    return '';
  }

  return body.replace(HTML_COMMENT_PATTERN, '');
}

module.exports = {
  hasFilledSection,
  normalizeHeading,
  parseSections,
  withoutHtmlComments
};
