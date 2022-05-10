/* eslint-disable no-undef */
const base = require('@playwright/test');
const { expect } = require('@playwright/test');

exports.test = base.test.extend({
    page: async ({ baseURL, page }, use) => {
        const messages = [];
        page.on('console', msg => messages.push(`[${msg.type()}] ${msg.text()}`));
        await use(page);
        expect(messages).not.toContain('error');
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

