/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

// eslint-disable-next-line no-unused-vars
const { devices } = require('@playwright/test');
const MAX_FAILURES = 5;
const NUM_WORKERS = 2;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 2, //Retries 2 times for a total of 3 runs. When running sharded and with max-failures=5, this should ensure that flake is managed without failing the full suite
  testDir: 'tests',
  testIgnore: '**/*.perf.spec.js', //Ignore performance tests and define in playwright-perfromance.config.js
  timeout: 60 * 1000,
  webServer: {
    command: 'npm run start:coverage',
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: false
  },
  maxFailures: MAX_FAILURES, //Limits failures to 5 to reduce CI Waste
  workers: NUM_WORKERS, //Limit to 2 for CircleCI Agent
  use: {
    baseURL: 'http://localhost:8080/',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off'
  },
  projects: [
    {
      name: 'chrome',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      use: {
        browserName: 'chromium'
      }
    },
    {
      name: 'MMOC',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'chromium',
        viewport: {
          width: 2560,
          height: 1440
        }
      }
    },
    {
      name: 'firefox',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'firefox'
      }
    },
    {
      name: 'chrome-beta', //Only Chrome Beta is available on ubuntu -- not chrome canary
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'chromium',
        channel: 'chrome-beta'
      }
    }
  ],
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: '../html-test-results' //Must be in different location due to https://github.com/microsoft/playwright/issues/12840
      }
    ],
    ['junit', { outputFile: '../test-results/results.xml' }],
    ['github'],
    ['@deploysentinel/playwright']
  ]
};

module.exports = config;
