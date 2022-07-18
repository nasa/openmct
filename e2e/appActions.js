/**
 * Wait for all animations within the given element and subtrees to finish
 * See: https://github.com/microsoft/playwright/issues/15660#issuecomment-1184911658
 * @param {import('@playwright/test').Locator} locator
 */
function waitForAnimations(locator) {
    return locator
        .evaluate((element) =>
            Promise.all(
                element
                    .getAnimations({ subtree: true })
                    .map((animation) => animation.finished)));
}

// eslint-disable-next-line no-undef
module.exports = {
    waitForAnimations
};
