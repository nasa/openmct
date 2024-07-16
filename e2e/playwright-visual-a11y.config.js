// playwright.config.js
// @ts-check
import { fileURLToPath } from 'url';
/** @type {import('@playwright/test').PlaywrightTestConfig<{ theme: string }>} */
const config = {
  retries: 0, // Visual tests should never retry due to snapshot comparison errors. Leaving as a shim
  testDir: 'tests/visual-a11y',
  testMatch: '**/*.visual.spec.js', // only run visual tests
  timeout: 60 * 1000,
  workers: 1, //Lower stress on Circle CI Agent for Visual tests https://github.com/percy/cli/discussions/1067
  webServer: {
    command: 'npm run start:coverage',
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:8080/',
    headless: true, // this needs to remain headless to avoid visual changes due to GPU rendering in headed browsers
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
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
      name: 'chrome-snow-theme', //Runs the same visual tests but with snow-theme enabled
      use: {
        browserName: 'chromium',
        theme: 'snow'
      }
    }
  ],
  reporter: [
    ['list'],
    ['junit', { outputFile: '../test-results/results.xml' }],
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
