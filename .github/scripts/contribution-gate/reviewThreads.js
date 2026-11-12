/**
 * Works out which of the automated reviewers' comments the author has answered.
 *
 * Two reviewers comment without being asked by a person: Copilot, which the gate
 * requests, and CodeQL, which posts its own security findings. Our rule is that
 * every comment from either gets a reply, saying how it was addressed or why the
 * author disagrees. Resolving a thread by clicking, with no reply, leaves nothing
 * for a human reviewer to read, so it does not count.
 */

const { AUTOMATED_REVIEWER_LOGINS } = require('./config');

/**
 * The GraphQL API, which the threads come from, names a bot without the "[bot]"
 * suffix the REST API adds: CodeQL is "github-advanced-security" there. Logins
 * are compared without it, so the configured names work in either form.
 */
const BOT_SUFFIX = /\[bot\]$/;
const AUTOMATED_REVIEWERS = AUTOMATED_REVIEWER_LOGINS.map(normalizeLogin);

function findAutomatedReviewThreads(reviewThreads) {
  return reviewThreads.filter(isStartedByAutomatedReviewer);
}

/** Threads that still need a word from the author before a human is asked to look. */
function findThreadsAwaitingReply(reviewThreads) {
  return findAutomatedReviewThreads(reviewThreads).filter((thread) => !hasReplyFromPerson(thread));
}

/** Answered threads the author left open; the gate resolves these itself. */
function findRepliedOpenThreads(reviewThreads) {
  return findAutomatedReviewThreads(reviewThreads)
    .filter(hasReplyFromPerson)
    .filter((thread) => thread.isResolved === false);
}

function isFromAutomatedReviewer(comment) {
  return AUTOMATED_REVIEWERS.includes(normalizeLogin(readLogin(comment)));
}

function isStartedByAutomatedReviewer(thread) {
  const firstComment = thread.comments[0];

  if (firstComment === undefined) {
    return false;
  }

  return isFromAutomatedReviewer(firstComment);
}

function hasReplyFromPerson(thread) {
  const replies = thread.comments.slice(1);

  return replies.some((comment) => !isFromAutomatedReviewer(comment));
}

function readLogin(comment) {
  if (comment.author === undefined || comment.author === null) {
    return '';
  }

  return comment.author.login;
}

function normalizeLogin(login) {
  return login.toLowerCase().replace(BOT_SUFFIX, '');
}

module.exports = { findAutomatedReviewThreads, findRepliedOpenThreads, findThreadsAwaitingReply };
