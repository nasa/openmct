/**
 * Reads the state of the automated checks the gate waits for before it spends
 * money on an AI review.
 */

const { CHECKS_REQUIRED_WHEN_REPORTED, REQUIRED_CHECK_NAMES } = require('./config');

/** Conclusions that do not mean the check found a problem. */
const ACCEPTABLE_CONCLUSIONS = ['success', 'skipped', 'neutral'];

function summarizeRequiredChecks(checkConclusions) {
  const pending = REQUIRED_CHECK_NAMES.filter((name) => isPending(checkConclusions, name));
  const failing = [...REQUIRED_CHECK_NAMES, ...CHECKS_REQUIRED_WHEN_REPORTED].filter((name) =>
    isFailing(checkConclusions, name)
  );

  return {
    pending,
    failing,
    allPassed: pending.length === 0 && failing.length === 0
  };
}

function describeCheckState(checkSummary) {
  if (checkSummary.failing.length > 0) {
    return `These checks need to pass before a reviewer is asked to look: ${checkSummary.failing.join(', ')}.`;
  }

  return `Waiting for the automated checks to finish: ${checkSummary.pending.join(', ')}.`;
}

function isPending(checkConclusions, name) {
  const conclusion = checkConclusions.get(name);

  return conclusion === undefined || conclusion === null;
}

function isFailing(checkConclusions, name) {
  const conclusion = checkConclusions.get(name);

  if (isPending(checkConclusions, name)) {
    return false;
  }

  return ACCEPTABLE_CONCLUSIONS.includes(conclusion) === false;
}

module.exports = { describeCheckState, summarizeRequiredChecks };
