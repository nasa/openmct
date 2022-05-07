/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

const { devices } = require('@playwright/test');

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
    workers: 1,
    use: {
        browserName: "chromium",
        baseURL: 'http://localhost:8080/',
        headless: false,
        ignoreHTTPSErrors: true,
        screenshot: 'on',
        trace: 'on',
        video: 'on'
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
        ['allure-playwright']
    ]
};

module.exports = config;
