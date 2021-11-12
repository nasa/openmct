// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 2,
    testDir: 'tests',
    timeout: 60 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 240 * 1000,
        reuseExistingServer: !process.env.CI,
    },
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on-first-retry',
        video: 'on-first-retry'
    },
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }]
    ]
};

module.exports = config;
