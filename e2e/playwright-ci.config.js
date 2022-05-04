/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    retries: 1,
    testDir: 'tests',
    timeout: 60 * 1000,
    webServer: {
        command: 'npm run start',
        port: 8080,
        timeout: 200 * 1000,
        reuseExistingServer: !process.env.CI
    },
    workers: 2, //Limit to 2 for CircleCI Agent
    use: {
        baseURL: 'http://localhost:8080/',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on',
        video: 'on'
    },
    projects: [
        {
            name: 'chrome',
            use: {
                browserName: 'chromium',
                ...devices['Desktop Chrome']
            }
        },
        {
            name: 'MMOC',
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
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['allure-playwright'],
        ['github']
    ]
};

module.exports = config;
