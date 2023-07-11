/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

/*
 * This test suite is meant to be executed against a couchdb container. More doc to come
 *
 */

const { test, expect } = require('../../pluginFixtures');

test.describe('CouchDB Status Indicator with mocked responses @couchdb', () => {
  test.use({ failOnConsoleError: false });
  //TODO BeforeAll Verify CouchDB Connectivity with APIContext
  test('Shows green if connected', async ({ page }) => {
    await page.route('**/openmct/mine', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    //Go to baseURL
    await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', {
      waitUntil: 'networkidle'
    });
    await expect(page.locator('div:has-text("CouchDB is connected")').nth(3)).toBeVisible();
  });
  test('Shows red if not connected', async ({ page }) => {
    await page.route('**/openmct/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    //Go to baseURL
    await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', {
      waitUntil: 'networkidle'
    });
    await expect(page.locator('div:has-text("CouchDB is offline")').nth(3)).toBeVisible();
  });
  test('Shows unknown if it receives an unexpected response code', async ({ page }) => {
    await page.route('**/openmct/mine', (route) => {
      route.fulfill({
        status: 418,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    //Go to baseURL
    await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', {
      waitUntil: 'networkidle'
    });
    await expect(page.locator('div:has-text("CouchDB connectivity unknown")').nth(3)).toBeVisible();
  });
});

test.describe('CouchDB initialization with mocked responses @couchdb', () => {
  test.use({ failOnConsoleError: false });
  test("'My Items' folder is created if it doesn't exist", async ({ page }) => {
    const mockedMissingObjectResponsefromCouchDB = {
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({})
    };

    // Override the first request to GET openmct/mine to return a 404.
    // This simulates the case of starting Open MCT with a fresh database
    // and no "My Items" folder created yet.
    await page.route(
      '**/mine',
      (route) => {
        route.fulfill(mockedMissingObjectResponsefromCouchDB);
      },
      { times: 1 }
    );

    // Set up promise to verify that a PUT request to create "My Items"
    // folder was made.
    const putMineFolderRequest = page.waitForRequest(
      (req) => req.url().endsWith('/mine') && req.method() === 'PUT'
    );

    // Set up promise to verify that a GET request to retrieve "My Items"
    // folder was made.
    const getMineFolderRequest = page.waitForRequest(
      (req) => req.url().endsWith('/mine') && req.method() === 'GET'
    );

    // Go to baseURL.
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Wait for both requests to resolve.
    await Promise.all([putMineFolderRequest, getMineFolderRequest]);
  });
});
