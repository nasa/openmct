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
    reuseExistingServer: true //This was originally disabled to prevent differences in local debugging vs. CI. However, it significantly speeds up local debugging.
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
    },
    {
      name: 'darkmatter-theme', //Runs the same visual tests but with darkmatter-theme
      use: {
        browserName: 'chromium',
        theme: 'darkmatter'
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
