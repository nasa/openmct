/**
 * Works out which of the AI reviewer's comments the author has answered.
 *
 * Our rule is that every comment from the AI reviewer gets a reply, either
 * saying how it was addressed or why the author disagrees. Resolving a thread by
 * clicking, with no reply, leaves nothing for a human reviewer to read, so it
 * does not count.
 */

const { COPILOT_AUTHOR_LOGINS } = require('./config');

function findAiReviewThreads(reviewThreads) {
  return reviewThreads.filter(isStartedByAiReviewer);
}

/** Threads that still need a word from the author before a human is asked to look. */
function findThreadsAwaitingReply(reviewThreads) {
  return findAiReviewThreads(reviewThreads).filter((thread) => !hasReplyFromPerson(thread));
}

/** Answered threads the author left open; the gate resolves these itself. */
function findRepliedOpenThreads(reviewThreads) {
  return findAiReviewThreads(reviewThreads)
    .filter(hasReplyFromPerson)
    .filter((thread) => thread.isResolved === false);
}

function isFromAiReviewer(comment) {
  const login = readLogin(comment);

  return COPILOT_AUTHOR_LOGINS.includes(login);
}

function isStartedByAiReviewer(thread) {
  const firstComment = thread.comments[0];

  if (firstComment === undefined) {
    return false;
  }

  return isFromAiReviewer(firstComment);
}

function hasReplyFromPerson(thread) {
  const replies = thread.comments.slice(1);

  return replies.some((comment) => !isFromAiReviewer(comment));
}

function readLogin(comment) {
  if (comment.author === undefined || comment.author === null) {
    return '';
  }

  return comment.author.login.toLowerCase();
}

module.exports = { findAiReviewThreads, findRepliedOpenThreads, findThreadsAwaitingReply };
