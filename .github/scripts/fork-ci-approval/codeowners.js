/**
 * Reads the paths listed in CODEOWNERS, and finds which changed files fall under
 * them. Every path listed there is treated as one that decides what runs in CI or
 * at install, so a pull request from a fork that changes any of them waits for a
 * maintainer before its CI runs.
 *
 * Patterns follow CODEOWNERS rules, which are .gitignore rules: a pattern with a
 * slash at the start or in the middle is anchored to the repository root, one
 * without matches at any depth, a trailing slash means a directory, `*` matches
 * within one path segment and `**` across segments.
 */

const COMMENT_PREFIX = '#';
const ANY_DEPTH_PREFIX = '(?:^|.*/)';
const DOUBLE_STAR_PLACEHOLDER = '\u0000';
const REGEXP_SPECIAL_CHARACTERS = /[.+^${}()|[\]\\]/g;

/** @returns {string[]} the path pattern from each rule in a CODEOWNERS file */
function readOwnedPatterns(codeownersText) {
  return codeownersText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && line.startsWith(COMMENT_PREFIX) === false)
    .map((line) => line.split(/\s+/)[0]);
}

/** @returns {string[]} the paths that at least one pattern covers */
function findOwnedPaths(paths, patterns) {
  const expressions = patterns.map(patternToRegExp);

  return paths.filter((path) => expressions.some((expression) => expression.test(path)));
}

function patternToRegExp(pattern) {
  const isDirectoryOnly = pattern.endsWith('/');
  const trimmed = pattern.replace(/^\//, '').replace(/\/$/, '');
  const isAnchored = pattern.startsWith('/') || trimmed.includes('/');
  const body = globToExpression(trimmed);
  const prefix = isAnchored ? '^' : ANY_DEPTH_PREFIX;
  const suffix = isDirectoryOnly ? '/.*$' : '(?:/.*)?$';

  return new RegExp(`${prefix}${body}${suffix}`);
}

function globToExpression(glob) {
  return glob
    .replace(REGEXP_SPECIAL_CHARACTERS, '\\$&')
    .replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER)
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .split(DOUBLE_STAR_PLACEHOLDER)
    .join('.*');
}

module.exports = { findOwnedPaths, readOwnedPatterns };
