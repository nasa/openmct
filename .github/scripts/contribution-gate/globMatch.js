/**
 * Matches file paths against the small subset of glob syntax the gate's
 * configuration uses: `*` for part of one path segment, `**` for any number of
 * segments.
 */

const PATH_SEPARATOR = '/';
const DOUBLE_STAR_PLACEHOLDER = '\u0000';
const REGEXP_SPECIAL_CHARACTERS = /[.+^${}()|[\]\\]/g;

function matchesAnyPattern(filePath, patterns) {
  return patterns.some((pattern) => matchesPattern(filePath, pattern));
}

function matchesPattern(filePath, pattern) {
  return globToRegExp(pattern).test(filePath);
}

function globToRegExp(pattern) {
  const expression = escapeRegExpCharacters(pattern)
    .replace(/\*\*\//g, DOUBLE_STAR_PLACEHOLDER)
    .replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER)
    .replace(/\*/g, `[^${PATH_SEPARATOR}]*`)
    .split(DOUBLE_STAR_PLACEHOLDER)
    .join('.*');

  return new RegExp(`^${expression}$`);
}

function escapeRegExpCharacters(pattern) {
  return pattern.replace(REGEXP_SPECIAL_CHARACTERS, '\\$&');
}

module.exports = { matchesAnyPattern, matchesPattern };
