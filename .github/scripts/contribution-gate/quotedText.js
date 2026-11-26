/**
 * Makes text a contributor wrote safe to repeat in the gate's comments.
 *
 * It is shown as inline code, so an @-mention in it notifies nobody and nothing in
 * it renders as markdown. Backticks, which would end the code span, and angle
 * brackets, which could otherwise rebuild the hidden marker that holds the gate's
 * state, are removed, as are line breaks. Removing single characters cannot
 * create new ones, so one pass is complete.
 */

const UNSAFE_CHARACTERS = /[`<>\r\n]/g;

function quoteContributorText(text) {
  return `\`${String(text).replace(UNSAFE_CHARACTERS, '')}\``;
}

module.exports = { quoteContributorText };
