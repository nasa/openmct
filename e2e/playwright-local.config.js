// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0,
  testDir: 'tests',
  testMatch: '**/*.e2e.spec.js', // only run e2e tests
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
      grepInvert: /@snapshot/,
      use: {
        browserName: 'webkit'
      }
    },
    {
      name: 'firefox',
      grepInvert: /@snapshot/,
      use: {
        browserName: 'firefox'
      }
    },
    {
      name: 'canary',
      grepInvert: /@snapshot/,
      use: {
        browserName: 'chromium',
        channel: 'chrome-canary' //Note this is not available in ubuntu/CircleCI
      }
    },
    {
      name: 'chrome-beta',
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
        open: 'on-failure',
        outputFolder: '../html-test-results' //Must be in different location due to https://github.com/microsoft/playwright/issues/12840
      }
    ]
  ]
};

export default config;
