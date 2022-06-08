/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

// eslint-disable-next-line no-unused-vars
const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 1,
    testDir: 'tests',
    testIgnore: '**/*.perf.spec.js', //Ignore performance tests and define in playwright-perfromance.config.js
    timeout: 60 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    maxFailures: process.env.CI ? 5 : undefined, //Limits failures to 5 to reduce CI Waste
    workers: 2, //Limit to 2 for CircleCI Agent
    use: {
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        video: 'on-first-retry'
    },
    projects: [
        {
            name: 'chrome',
            use: {
                browserName: 'chromium'
            }
        },
        {
            name: 'MMOC',
            grepInvert: /@snapshot/,
            use: {
                browserName: 'chromium',
                viewport: {
                    width: 2560,
                    height: 1440
                }
            }
        }
        /*{
            name: 'ipad',
            use: {
                browserName: 'webkit',
                ...devices['iPad (gen 7) landscape'] // Complete List https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
            }
        }*/
    ],
    reporter: [
        ['list'],
        ['html', {
            open: 'never',
            outputFolder: '../test-results/html/'
        }],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['github']
    ]
};

module.exports = config;
