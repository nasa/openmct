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
    command: 'npm run start', //coverage not generated
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: !CI
  },
  use: {
    browserName: 'chromium',
    baseURL: 'http://localhost:8080/',
    headless: CI, //Only if running locally
    ignoreHTTPSErrors: true,
    screenshot: 'off',
    trace: 'on-first-retry',
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
    ['junit', { outputFile: '../test-results/results.xml' }],
    ['json', { outputFile: '../test-results/results.json' }]
  ]
};

module.exports = config;
