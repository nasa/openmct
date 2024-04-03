// playwright.config.js
// @ts-check
import { devices } from '@playwright/test';
import { fileURLToPath } from 'url';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0, //Retries are not needed with watch mode
  testDir: 'tests',
  timeout: 60 * 1000,
  webServer: {
    command: 'npm run start', //Start in dev mode for hot reloading
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
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
    },
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
