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
const COMMENT_OPEN = '<!--';
const COMMENT_CLOSE = '-->';

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

/**
 * Drops HTML comments, which templates use for instructions to the author, so a
 * section holding nothing else counts as empty. A comment that is never closed
 * runs to the end, as it would on GitHub.
 *
 * This only affects how sections are read. It is not what keeps the gate's
 * comments safe: text quoted back to a contributor is made safe where it is
 * quoted (quotedText.js), and the gate's state is only read from its own comment.
 */
function withoutHtmlComments(body) {
  if (body === undefined || body === null) {
    return '';
  }

  const pieces = [];
  let position = 0;

  while (position < body.length) {
    const commentStart = body.indexOf(COMMENT_OPEN, position);
    const commentEnd = commentStart === -1 ? -1 : body.indexOf(COMMENT_CLOSE, commentStart + COMMENT_OPEN.length);

    pieces.push(body.slice(position, commentStart === -1 ? body.length : commentStart));
    position = commentEnd === -1 ? body.length : commentEnd + COMMENT_CLOSE.length;
  }

  return pieces.join('');
}

module.exports = {
  hasFilledSection,
  normalizeHeading,
  parseSections,
  withoutHtmlComments
};
