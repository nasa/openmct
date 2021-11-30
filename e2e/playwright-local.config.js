/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 0,
    testDir: 'tests',
    timeout: 30 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI
    },
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: false,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on',
        video: 'on'
    },
    reporter: [
        ['list'],
        ['allure-playwright']
    ]
};

module.exports = config;
