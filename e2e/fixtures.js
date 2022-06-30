/* This file extends the base functionality of the playwright test framework to enable
 * code coverage instrumentation, console log error detection and working with a 3rd
 * party Chrome-as-a-service extension called Browserless.
 */

const base = require('@playwright/test');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

/**
 * Takes a `ConsoleMessage` and returns a formatted string
 * @param {import('@playwright/test').ConsoleMessage} msg
 * @returns {String} formatted string with message type, text, url, and line and column numbers
 */
function consoleMessageToString(msg) {
    const { url, lineNumber, columnNumber } = msg.location();

    return `[${msg.type()}] ${msg.text()}
    at (${url} ${lineNumber}:${columnNumber})`;
}

//The following is based on https://github.com/mxschmitt/playwright-test-coverage
// eslint-disable-next-line no-undef
const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

// eslint-disable-next-line no-undef
exports.test = base.test.extend({
    //The following is based on https://github.com/mxschmitt/playwright-test-coverage
    context: async ({ context }, use) => {
        await context.addInitScript(() =>
            window.addEventListener('beforeunload', () =>
                (window).collectIstanbulCoverage(JSON.stringify((window).__coverage__))
            )
        );
        await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
        await context.exposeFunction('collectIstanbulCoverage', (coverageJSON) => {
            if (coverageJSON) {
                fs.writeFileSync(path.join(istanbulCLIOutput, `playwright_coverage_${uuid()}.json`), coverageJSON);
            }
        });
        await use(context);
        for (const page of context.pages()) {
            await page.evaluate(() => (window).collectIstanbulCoverage(JSON.stringify((window).__coverage__)));
        }
    },
    page: async ({ baseURL, page }, use) => {
        const messages = [];
        page.on('console', (msg) => messages.push(msg));
        await use(page);
        messages.forEach(
            msg => expect.soft(msg.type(), `Console error detected: ${consoleMessageToString(msg)}`).not.toEqual('error')
        );
    },
    browser: async ({ playwright, browser }, use, workerInfo) => {
        // Use browserless if configured
        if (workerInfo.project.name.match(/browserless/)) {
            const vBrowser = await playwright.chromium.connectOverCDP({
                endpointURL: 'ws://localhost:3003'
            });
            await use(vBrowser);
        } else {
            // Use Local Browser for testing.
            await use(browser);
        }
    }
});

