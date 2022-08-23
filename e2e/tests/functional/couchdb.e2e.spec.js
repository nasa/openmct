/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

const { test, expect } = require('../../baseFixtures');

test.describe("CouchDB Status Indicator @couchdb", () => {
    test.use({ failOnConsoleError: false });
    //TODO BeforeAll Verify CouchDB Connectivity with APIContext
    test('Shows green if connected', async ({ page }) => {
        await page.route('**/openmct/mine', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        });

        //Go to baseURL
        await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', { waitUntil: 'networkidle' });
        await expect(page.locator('div:has-text("CouchDB is connected")').nth(3)).toBeVisible();
    });
    test('Shows red if not connected', async ({ page }) => {
        await page.route('**/openmct/**', route => {
            route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        });

        //Go to baseURL
        await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', { waitUntil: 'networkidle' });
        await expect(page.locator('div:has-text("CouchDB is offline")').nth(3)).toBeVisible();
    });
    test('Shows unknown if it receives an unexpected response code', async ({ page }) => {
        await page.route('**/openmct/mine', route => {
            route.fulfill({
                status: 418,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        });

        //Go to baseURL
        await page.goto('./#/browse/mine?hideTree=true&hideInspector=true', { waitUntil: 'networkidle' });
        await expect(page.locator('div:has-text("CouchDB connectivity unknown")').nth(3)).toBeVisible();
    });
});

test.describe("CouchDB initialization @couchdb", () => {
    test.use({ failOnConsoleError: false });
    test("'My Items' folder is created if it doesn't exist", async ({ page }) => {
        // Store any relevant PUT requests that happen on the page
        const createMineFolderRequests = [];
        page.on('request', req => {
            // eslint-disable-next-line playwright/no-conditional-in-test
            if (req.method() === 'PUT' && req.url().endsWith('openmct/mine')) {
                createMineFolderRequests.push(req);
            }
        });

        // Override the first request to GET openmct/mine to return a 404
        await page.route('**/openmct/mine', route => {
            route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        }, { times: 1 });

        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Verify that error banner is displayed
        const bannerMessage = await page.locator('.c-message-banner__message').innerText();
        expect(bannerMessage).toEqual('Failed to retrieve object mine');

        // Verify that a PUT request to create "My Items" folder was made
        expect.poll(() => createMineFolderRequests.length, {
            message: 'Verify that PUT request to create "mine" folder was made',
            timeout: 1000
        }).toBeGreaterThanOrEqual(1);
    });
});
