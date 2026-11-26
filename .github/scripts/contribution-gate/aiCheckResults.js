/**
 * Reads the result of each of CodeRabbit's pre-merge checks, so the checklist
 * can show they have all passed before CodeRabbit approves, which it does only
 * once its comments are answered as well.
 *
 * CodeRabbit reports them only as a table in its summary comment, one row per
 * check, with an image whose alt text is the result:
 *
 *   |  Issue Explains Why  | ![Passed](https://…/pre-merge-checks-passed.svg) | … |
 *
 * That format is CodeRabbit's, and undocumented. Until every check is found in
 * it, they are shown as still in progress, and CodeRabbit's verdict, which the
 * gate reads from its review, wins where it has given one.
 */

const { AI_REVIEWER_LOGINS } = require('./config');

/** The outcomes CodeRabbit gives a check, as the alt text of its image. */
const AI_CHECK_RESULTS = {
  passed: 'passed',
  error: 'error',
  warning: 'warning'
};

const RESULT_ROW_PATTERN = /^\|\s*([^|\n]+?)\s*\|\s*!\[(\w+)\]\(/gm;
const BOT_ACCOUNT_TYPE = 'Bot';

/**
 * @param {{body: string, user: {login: string, type: string}|null}[]} comments the
 * pull request's conversation, as the REST API returns it
 * @returns {Map<string, string>} each check's result, keyed by its name in lower case
 */
function readAiCheckResults(comments) {
  const results = new Map();

  comments.filter(isFromAiReviewer).forEach((comment) => {
    for (const [, name, result] of comment.body.matchAll(RESULT_ROW_PATTERN)) {
      results.set(name.toLowerCase(), result.toLowerCase());
    }
  });

  return results;
}

/**
 * The REST API's login, with its "[bot]" suffix, and the account type are both
 * checked, so that nobody else's comment can pass for CodeRabbit's results.
 */
function isFromAiReviewer(comment) {
  if (comment.user === null) {
    return false;
  }

  return comment.user.type === BOT_ACCOUNT_TYPE && AI_REVIEWER_LOGINS.includes(comment.user.login);
}

/** @returns {string|undefined} the check's result, or undefined if CodeRabbit has not reported it */
function findAiCheckResult(aiCheckResults, checkName) {
  return aiCheckResults.get(checkName.toLowerCase());
}

module.exports = { AI_CHECK_RESULTS, findAiCheckResult, readAiCheckResults };
