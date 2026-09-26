/**
 * Keeps the gate's state in the sticky comment it posts, so that the gate needs
 * no database. The marker is an HTML comment, so it is invisible on GitHub.
 */

const MARKER_PREFIX = '<!-- openmct-gate ';
const MARKER_SUFFIX = ' -->';
const MARKER_PATTERN = /<!-- openmct-gate (\{[\s\S]*?\}) -->/;

/**
 * @param {string} commentBody
 * @returns {object} the stored state, or an empty object when the comment has
 * no marker or a corrupt one
 */
function readMarker(commentBody) {
  const markerMatch = String(commentBody).match(MARKER_PATTERN);

  if (markerMatch === null) {
    return {};
  }

  return parseMarkerJson(markerMatch[1]);
}

function renderMarker(state) {
  return `${MARKER_PREFIX}${JSON.stringify(state)}${MARKER_SUFFIX}`;
}

function parseMarkerJson(markerJson) {
  try {
    return JSON.parse(markerJson);
  } catch (error) {
    return {};
  }
}

module.exports = { MARKER_PREFIX, readMarker, renderMarker };
