/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
