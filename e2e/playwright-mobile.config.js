// playwright.config.js
// @ts-check

import { devices } from '@playwright/test';
const MAX_FAILURES = 5;
const NUM_WORKERS = 2;

import { fileURLToPath } from 'url';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 1, //Retries 2 times for a total of 3 runs. When running sharded and with max-failures=5, this should ensure that flake is managed without failing the full suite
  testDir: 'tests',
  testIgnore: '**/*.perf.spec.js', //Ignore performance tests and define in playwright-perfromance.config.js
  timeout: 30 * 1000,
  webServer: {
    command: 'npm run start:coverage',
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
      name: 'ipad',
      grep: /@mobile/,
      use: {
        storageState: fileURLToPath(
          new URL('./test-data/display_layout_with_child_layouts.json', import.meta.url)
        ),
        browserName: 'webkit',
        ...devices['iPad (gen 7) landscape'] // Complete List https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
      }
    },
    {
      name: 'iphone',
      grep: /@mobile/,
      use: {
        storageState: fileURLToPath(
          new URL('./test-data/display_layout_with_child_layouts.json', import.meta.url)
        ),
        browserName: 'webkit',
        ...devices['iPhone 14 Pro'] // Complete List https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
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
    ['junit', { outputFile: '../test-results/results.xml' }]
  ]
};

export default config;
