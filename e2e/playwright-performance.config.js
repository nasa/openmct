/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

const CI = process.env.CI === 'true';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 1, //Only for debugging purposes for trace: 'on-first-retry'
  testDir: 'tests/performance/',
  timeout: 60 * 1000,
  workers: 1, //Only run in serial with 1 worker
  webServer: {
    command: 'npm run start:prod', //Production mode
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: false //Must be run with this option to prevent dev mode
  },
  use: {
    browserName: 'chromium', //This will run twice - once for each project below.
    baseURL: 'http://localhost:8080/',
    headless: CI, //Only if running locally
    ignoreHTTPSErrors: false, //HTTP performance varies!
    screenshot: 'off',
    trace: 'on-first-retry',
    video: 'off'
  },
  projects: [
    {
      name: 'chrome-memory',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-notifications',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--js-flags=--no-move-object-start --expose-gc',
            '--enable-precise-memory-info',
            '--display=:100'
          ]
        }
      }
    },
    {
      name: 'chrome',
      use: {
        browserName: 'chromium'
      }
    }
  ],
  reporter: [
    ['list'],
    ['junit', { outputFile: '../test-results/results.xml' }],
    ['json', { outputFile: '../test-results/results.json' }]
  ]
};

module.exports = config;
