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
  retries: 0,
  testDir: 'tests',
  testMatch: '**/*.e2e.spec.js', // only run e2e tests
  testIgnore: '**/*.perf.spec.js',
  timeout: 30 * 1000,
  webServer: {
    command: 'npm run start:coverage',
    cwd: fileURLToPath(new URL('../', import.meta.url)), // Provide cwd for the root of the project
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
