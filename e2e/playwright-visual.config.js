/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 0, // visual tests should never retry due to snapshot comparison errors
    testDir: 'tests/visual',
    timeout: 90 * 1000,
    workers: 1, // visual tests should never run in parallel due to test pollution
    webServer: {
        command: 'cross-env NODE_ENV=test npm run start',
        url: 'http://localhost:8080/#',
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: true, // this needs to remain headless to avoid visual changes due to GPU
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'off',
        video: 'off'
    },
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }]
    ]
};

module.exports = config;
