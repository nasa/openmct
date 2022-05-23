/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 0,
    testDir: 'tests/performance/',
    timeout: 30 * 1000,
    workers: 1, //Only run in serial with 1 worker
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: Boolean(process.env.CI), //Only if running locally
        ignoreHTTPSErrors: true,
        screenshot: 'off',
        trace: 'off',
        video: 'off'
    },
    projects: [
        {
            name: 'chrome',
            use: {
                browserName: 'chromium'
            }
        }
    ],
    reporter: [
        ['list'],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['json', { outputFile: 'test-results/results.json' }]
    ]
};

module.exports = config;
