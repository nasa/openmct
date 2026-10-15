/**
 * Keeps the gate's state in the sticky comment it posts, so that the gate needs
 * no database. The marker is an HTML comment, so it is invisible on GitHub.
 */

const MARKER_PREFIX = '<!-- openmct-gate ';
const MARKER_SUFFIX = ' -->';

/**
 * The gate always writes its marker last, so only a marker that ends the comment
 * is read. Anything earlier in the comment is ignored, whatever it looks like.
 *
 * @param {string} commentBody
 * @returns {object} the stored state, or an empty object when the comment has
 * no marker or a corrupt one
 */
function readMarker(commentBody) {
  const body = String(commentBody).trimEnd();
  const start = body.lastIndexOf(MARKER_PREFIX);

  if (start === -1 || body.endsWith(MARKER_SUFFIX) === false) {
    return {};
  }

  return parseMarkerJson(body.slice(start + MARKER_PREFIX.length, body.length - MARKER_SUFFIX.length));
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
