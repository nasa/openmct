// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0, //Retries are not needed with watch mode
  testDir: 'tests',
  timeout: 60 * 1000,
  webServer: {
    command: 'npm run start', //Start in dev mode for hot reloading
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: true //This was originally disabled to prevent differences in local debugging vs. CI. However, it significantly speeds up local debugging.
  },
  workers: '75%', //Limit to 75% of the CPU to support running with dev server
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
    ['junit', { outputFile: '../test-results/results.xml' }]
  ]
};

export default config;
