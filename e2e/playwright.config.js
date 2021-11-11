// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on'
    },
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }]
    ]
};

module.exports = config;
