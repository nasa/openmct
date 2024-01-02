// playwright.config.js
// @ts-check

// eslint-disable-next-line no-unused-vars
import { devices } from '@playwright/test';
const MAX_FAILURES = 5;
const NUM_WORKERS = 2;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0, //Retries 2 times for a total of 3 runs. When running sharded and with max-failures=5, this should ensure that flake is managed without failing the full suite
  testDir: 'tests',
  timeout: 60 * 1000,
  webServer: {
    command: 'npm run start', //Start in dev mode for hot reloading
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: true //This was originally disabled to prevent differences in local debugging vs. CI. However, it significantly speeds up local debugging.
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
      testMatch: '**/*.spec.js', // run all tests
      use: {
        browserName: 'chromium'
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
    ['@deploysentinel/playwright']
  ]
};

export default config;
