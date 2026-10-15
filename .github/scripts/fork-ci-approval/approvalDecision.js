/**
 * Decides whether a fork pull request's held CI can be approved without a person.
 *
 * Whenever there is doubt, the answer is to hold it: that is how GitHub already
 * treats every fork, so the worst outcome is the behaviour we have today.
 */

const { findOwnedPaths } = require('./codeowners');

const DECISIONS = {
  approve: 'approve',
  hold: 'hold'
};

/**
 * @param {object} pullRequest
 * @param {string[]} pullRequest.changedPaths every path the pull request touches,
 * including the old path of anything renamed or moved
 * @param {boolean} pullRequest.isFileListComplete false when GitHub would not list
 * every changed file, so some change could not be checked
 * @param {string[]} ownedPatterns the path patterns from CODEOWNERS
 * @returns {{decision: string, reason: string, ownedPaths: string[]}}
 */
function decideApproval(pullRequest, ownedPatterns) {
  if (ownedPatterns.length === 0) {
    return hold('CODEOWNERS lists no paths, so there is no way to tell which changes are safe.');
  }

  if (pullRequest.isFileListComplete === false) {
    return hold('GitHub would not list every changed file, so not every change could be checked.');
  }

  const ownedPaths = findOwnedPaths(pullRequest.changedPaths, ownedPatterns);

  if (ownedPaths.length > 0) {
    return { decision: DECISIONS.hold, reason: 'It changes files that decide what runs in CI or at install.', ownedPaths };
  }

  return { decision: DECISIONS.approve, reason: 'It changes no file listed in CODEOWNERS.', ownedPaths: [] };
}

function hold(reason) {
  return { decision: DECISIONS.hold, reason, ownedPaths: [] };
}

module.exports = { DECISIONS, decideApproval };
