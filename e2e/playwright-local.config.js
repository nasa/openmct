/* eslint-disable no-undef */
// playwright.config.js
// @ts-check

// eslint-disable-next-line no-unused-vars
const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0,
  testDir: 'tests',
  testIgnore: '**/*.perf.spec.js',
  timeout: 30 * 1000,
  webServer: {
    command: 'npm run start:coverage',
    url: 'http://localhost:8080/#',
    timeout: 120 * 1000,
    reuseExistingServer: true
  },
  workers: 1,
  use: {
    browserName: 'chromium',
    baseURL: 'http://localhost:8080/',
    headless: false,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off'
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
      name: 'safari',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grep: /@ipad/, // only run ipad tests due to this bug https://github.com/microsoft/playwright/issues/8340
      grepInvert: /@snapshot/,
      use: {
        browserName: 'webkit'
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
      name: 'canary',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'chromium',
        channel: 'chrome-canary' //Note this is not available in ubuntu/CircleCI
      }
    },
    {
      name: 'chrome-beta',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'chromium',
        channel: 'chrome-beta'
      }
    },
    {
      name: 'ipad',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grep: /@ipad/,
      grepInvert: /@snapshot/,
      use: {
        browserName: 'webkit',
        ...devices['iPad (gen 7) landscape'] // Complete List https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
      }
    }
  ],
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'on-failure',
        outputFolder: '../html-test-results' //Must be in different location due to https://github.com/microsoft/playwright/issues/12840
      }
    ]
  ]
};

module.exports = config;
