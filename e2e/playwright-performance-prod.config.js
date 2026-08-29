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
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 0, //Only for debugging purposes for trace: 'on-first-retry'
  testDir: 'tests/performance/',
  testIgnore: '*.contract.perf.spec.js', //Run everything except contract tests which require marks in dev mode
  timeout: 60 * 1000,
  workers: 1, //Only run in serial with 1 worker
  webServer: {
    command: 'npm run start:prod', //Production mode
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: false //Must be run with this option to prevent dev mode
  },
  use: {
    baseURL: 'http://localhost:8080/',
    headless: true,
    ignoreHTTPSErrors: false, //HTTP performance varies!
    screenshot: 'off',
    trace: 'on-first-retry',
    video: 'off'
  },
  projects: [
    {
      name: 'chrome-memory',
      testMatch: '*.memory.perf.spec.js', //Only run memory tests
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-notifications',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--js-flags=--no-move-object-start --expose-gc',
            '--enable-precise-memory-info',
            '--display=:100'
          ]
        }
      }
    },
    {
      name: 'chrome',
      testIgnore: '*.memory.perf.spec.js', //Do not run memory tests without proper flags
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
