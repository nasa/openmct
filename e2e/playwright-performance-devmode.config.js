/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

const CI = process.env.CI === 'true';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 1, //Only for debugging purposes for trace: 'on-first-retry'
  testDir: 'tests/performance/',
  testMatch: '*todo-tests/*.contract.performance.js',
  timeout: 60 * 1000,
  workers: 1, //Only run in serial with 1 worker
  webServer: {
    command: 'npm run start:dev', //need development mode for performance.marks
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: false
  },
  use: {
    browserName: 'chromium',
    baseURL: 'http://localhost:8080/',
    headless: CI, //Only if running locally
    ignoreHTTPSErrors: false, //HTTP performance varies!
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
