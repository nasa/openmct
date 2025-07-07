// playwright.config.js
// @ts-check
import { fileURLToPath } from 'url';
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 1, //Only for debugging purposes for trace: 'on-first-retry'
  testDir: 'tests/performance/',
  testMatch: '*.contract.perf.spec.js', //Run everything except contract tests which require marks in dev mode
  timeout: 60 * 1000,
  workers: 1, //Only run in serial with 1 worker
  webServer: {
    command: 'npm run start', //need development mode for performance.marks and others
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: false
  },
  use: {
    browserName: 'chromium',
    baseURL: 'http://localhost:8080/',
    headless: true,
    ignoreHTTPSErrors: false, //HTTP performance varies!
    screenshot: 'off',
    trace: 'on-first-retry',
    video: 'off'
  },
  projects: [
    {
      name: 'chrome',
      testIgnore: '*.memory.perf.spec.js', //Do not run memory tests without proper flags. Shouldn't get here
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

export default config;
