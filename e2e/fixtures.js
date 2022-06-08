/* eslint-disable no-undef */

// This file extends the base functionality of the playwright test framework
const base = require('@playwright/test');
const { expect } = require('@playwright/test');

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

exports.test = base.test.extend({
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

