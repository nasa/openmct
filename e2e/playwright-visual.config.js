/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 0,
    testDir: 'tests',
    timeout: 90 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'off',
        video: 'on'
    },
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['allure-playwright']
    ]
};

module.exports = config;
