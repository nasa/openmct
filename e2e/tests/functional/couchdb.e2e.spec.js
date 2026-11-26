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

/*
 * This test suite is meant to be executed against a couchdb container. More doc to come
 *
 */

import { createDomainObjectWithDefaults } from '../../appActions.js';
import * as nbUtils from '../../helper/notebookUtils.js';
import { expect, test } from '../../pluginFixtures.js';

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
      waitUntil: 'domcontentloaded'
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
      waitUntil: 'domcontentloaded'
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
      waitUntil: 'domcontentloaded'
    });
    await expect(page.locator('div:has-text("CouchDB connectivity unknown")').nth(3)).toBeVisible();
  });
});

test.describe('CouchDB initialization with mocked responses @couchdb', () => {
  test.use({ failOnConsoleError: false });
  test("'My Items' folder is created if it doesn't exist", async ({ page }) => {
    const mockedMissingObjectResponseFromCouchDB = {
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
        route.fulfill(mockedMissingObjectResponseFromCouchDB);
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

test.describe('CouchDB changes feed @couchdb @network', () => {
  let testNotebook;

  test.beforeEach(async ({ page }) => {
    // capture the changes-feed URL (since=now lives here) and the object changes
    await page.addInitScript(() => {
      window.__sw = { changesUrls: [], objectChanges: [] };
      const NativeSharedWorker = window.SharedWorker;

      window.SharedWorker = new Proxy(NativeSharedWorker, {
        construct(Target, args) {
          const worker = new Target(...args);
          const port = worker.port;
          // page -> worker : capture the changes-feed URL (since=now lives here)
          const nativePost = port.postMessage.bind(port);

          port.postMessage = (msg, ...rest) => {
            if (msg?.request === 'changes' && msg.url) {
              window.__sw.changesUrls.push(msg.url);
            }

            return nativePost(msg, ...rest);
          };

          // worker -> page : capture relayed object changes
          port.addEventListener('message', (event) => {
            if (event.data?.objectChanges) {
              window.__sw.objectChanges.push(event.data.objectChanges);
            }
          });

          return worker;
        }
      });
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    testNotebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Test Notebook'
    });

    await page.goto(testNotebook.url);
  });

  test('Requests changes since "now" or a specific sequence number', async ({ page }) => {
    // watch the request to the changes feed in the shared worker, confirm the since parameter is set to "now"
    await expect.poll(() => page.evaluate(() => window.__sw.changesUrls[0] ?? null)).not.toBeNull();
    const url = await page.evaluate(() => window.__sw.changesUrls[0]);
    expect(new URL(url).searchParams.get('since')).toBe('now');

    // add 2 entries and verify in the event stream that those changes were posted
    // the way we create the entries, we create 2 changes for each entry, so we expect
    // 4 changes from these entries
    await nbUtils.enterTextEntry(page, 'First Entry');
    await nbUtils.enterTextEntry(page, 'Second Entry');

    // verify 5 changes were posted, the first one is the creation of the notebook, the other 4 are the entries
    await expect
      .poll(() =>
        page.evaluate(
          (id) => window.__sw.objectChanges.filter((c) => c.id === id).length,
          testNotebook.uuid
        )
      )
      .toEqual(5);

    // refresh the page and verify the changes are not in the event stream because we request now
    await page.reload();
    await expect
      .poll(() =>
        page.evaluate(
          (id) => window.__sw.objectChanges.filter((c) => c.id === id).length,
          testNotebook.uuid
        )
      )
      .toEqual(0);
  });
});
