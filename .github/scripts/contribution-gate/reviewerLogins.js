/**
 * Recognises the automated reviewers by login.
 *
 * The GraphQL API, which reviews and review threads come from, names a bot
 * without the "[bot]" suffix the REST API adds: CodeQL is
 * "github-advanced-security" there, and CodeRabbit is "coderabbitai". Logins are
 * compared without it, so the names in config.js work in either form.
 */

const { AI_REVIEWER_LOGINS, AUTOMATED_REVIEWER_LOGINS } = require('./config');

const BOT_SUFFIX = /\[bot\]$/;
const AI_REVIEWERS = AI_REVIEWER_LOGINS.map(normalizeLogin);
const AUTOMATED_REVIEWERS = AUTOMATED_REVIEWER_LOGINS.map(normalizeLogin);

/** CodeRabbit, whose approval is one of the two a pull request needs. */
function isAiReviewerLogin(login) {
  return AI_REVIEWERS.includes(normalizeLogin(login));
}

/** Every reviewer whose comments a contributor must answer. */
function isAutomatedReviewerLogin(login) {
  return AUTOMATED_REVIEWERS.includes(normalizeLogin(login));
}

function normalizeLogin(login) {
  return login.toLowerCase().replace(BOT_SUFFIX, '');
}

module.exports = { isAiReviewerLogin, isAutomatedReviewerLogin };
