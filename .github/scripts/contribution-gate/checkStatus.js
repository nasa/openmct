/**
 * Reads the state of the automated checks the gate waits for before it asks the
 * team to review.
 */

const { CHECKS_REQUIRED_WHEN_REPORTED, REQUIRED_CHECK_NAMES } = require('./config');

const CHECK_STATUSES = {
  passed: 'passed',
  failed: 'failed',
  pending: 'pending',
  unreported: 'unreported'
};

/** Conclusions that do not mean the check found a problem. */
const ACCEPTABLE_CONCLUSIONS = ['success', 'skipped', 'neutral'];

/**
 * A required check that has not reported yet is waiting. One that is required
 * only when it runs is waited for only once it has reported, and is running.
 */
function summarizeRequiredChecks(checkConclusions) {
  const pending = [
    ...REQUIRED_CHECK_NAMES.filter((name) => isUnfinished(checkConclusions, name)),
    ...CHECKS_REQUIRED_WHEN_REPORTED.filter(
      (name) => findCheckStatus(checkConclusions, name) === CHECK_STATUSES.pending
    )
  ];
  const failing = [...REQUIRED_CHECK_NAMES, ...CHECKS_REQUIRED_WHEN_REPORTED].filter(
    (name) => findCheckStatus(checkConclusions, name) === CHECK_STATUSES.failed
  );

  return {
    pending,
    failing,
    allPassed: pending.length === 0 && failing.length === 0
  };
}

/**
 * @returns {string} one of CHECK_STATUSES: unreported if the check has not
 * appeared, pending while it runs
 */
function findCheckStatus(checkConclusions, name) {
  if (checkConclusions.has(name) === false) {
    return CHECK_STATUSES.unreported;
  }

  const conclusion = checkConclusions.get(name);

  if (conclusion === null) {
    return CHECK_STATUSES.pending;
  }

  if (ACCEPTABLE_CONCLUSIONS.includes(conclusion)) {
    return CHECK_STATUSES.passed;
  }

  return CHECK_STATUSES.failed;
}

function isUnfinished(checkConclusions, name) {
  const status = findCheckStatus(checkConclusions, name);

  return status === CHECK_STATUSES.pending || status === CHECK_STATUSES.unreported;
}

module.exports = { CHECK_STATUSES, findCheckStatus, summarizeRequiredChecks };
