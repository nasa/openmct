/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 2,
    testDir: 'tests',
    timeout: 90 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    workers: 2, //Limit to 2 for CircleCI Agent
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on',
        video: 'on'
    },
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['allure-playwright']
    ]
};

module.exports = config;
