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

// eslint-disable-next-line no-unused-vars
import { devices } from '@playwright/test';
import { fileURLToPath } from 'url';
const MAX_FAILURES = 5;
const NUM_WORKERS = 4;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  retries: 2, //Retries 2 times for a total of 3 runs. When running sharded and with max-failures=5, this should ensure that flake is managed without failing the full suite
  testDir: 'tests',
  grepInvert: /@mobile/, //Ignore mobile tests
  testIgnore: '**/*.perf.spec.js', //Ignore performance tests and define in playwright-performance.config.js
  timeout: 60 * 1000,
  webServer: {
    command: 'npm run start:coverage',
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
    url: 'http://localhost:8080/#',
    timeout: 200 * 1000,
    reuseExistingServer: true //This was originally disabled to prevent differences in local debugging vs. CI. However, it significantly speeds up local debugging.
  },
  maxFailures: MAX_FAILURES, //Limits failures to 5 to reduce CI Waste
  workers: NUM_WORKERS,
  use: {
    baseURL: 'http://localhost:8080/',
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
    // @ts-ignore - custom configuration option for nyc codecoverage output path
    coveragePath: fileURLToPath(new URL('../.nyc_output', import.meta.url))
  },
  projects: [
    {
      name: 'chrome',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
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
      name: 'firefox',
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
      grepInvert: /@snapshot/,
      use: {
        browserName: 'firefox'
      }
    },
    {
      name: 'chrome-beta', //Only Chrome Beta is available on ubuntu -- not chrome canary
      testMatch: '**/*.e2e.spec.js', // only run e2e tests
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
        open: 'never',
        outputFolder: '../html-test-results' //Must be in different location due to https://github.com/microsoft/playwright/issues/12840
      }
    ],
    ['junit', { outputFile: '../test-results/results.xml' }]
  ]
};

export default config;
