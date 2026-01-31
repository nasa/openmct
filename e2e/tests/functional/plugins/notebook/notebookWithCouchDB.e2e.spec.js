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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks with CouchDB.
*/

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import * as nbUtils from '../../../../helper/notebookUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Notebook Tests with CouchDB @couchdb @network', () => {
  let testNotebook;

  test.beforeEach(async ({ page }) => {
    // Navigate to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    // Create Notebook
    testNotebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Test Notebook'
    });
    await page.goto(testNotebook.url);
    await expect(page.getByLabel('Browse bar object name')).toHaveText(testNotebook.name);
  });

  test('Search tests', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/akhenry/openmct-yamcs/issues/69'
    });
    await nbUtils.enterTextEntry(page, 'First Entry');
    await page.getByText('Annotations').click();

    // Add three tags
    await addTagAndAwaitNetwork(page, 'Science');
    await addTagAndAwaitNetwork(page, 'Drilling');
    await addTagAndAwaitNetwork(page, 'Driving');

    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    //Partial match for "Science" should only return Science
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Sc');
    await expect(page.locator('[aria-label="Annotation Search Result"]').first()).toContainText(
      'Science'
    );
    await expect(page.locator('[aria-label="Annotation Search Result"]').first()).not.toContainText(
      'Driving'
    );
    await expect(page.locator('[aria-label="Annotation Search Result"]').first()).not.toContainText(
      'Drilling'
    );

    //Searching for a tag which does not exist should return an empty result
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Xq');
    await expect(page.getByText('No results found')).toBeVisible();
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Drilling');
    await expect(page.locator('c-gsearch-result__tags')).toBeVisible();
    await expect(page.locator('c-gsearch-result__tags')).toContainText('Drilling');
  });
});

// Try to reduce indeterminism of browser requests by only returning fetch requests.
// Filter out preflight CORS, fetching stylesheets, page icons, etc. that can occur during tests
function filterNonFetchRequests(requests) {
  return requests.filter((request) => {
    return request.resourceType === 'fetch';
  });
}

/**
 * Add a tag to a notebook entry by providing a tagName.
 * Reduces indeterminism by waiting until all necessary requests are completed.
 * @param {import('@playwright/test').Page} page
 * @param {string} tagName
 */
async function addTagAndAwaitNetwork(page, tagName) {
  await page.hover(`button:has-text("Add Tag")`);
  await page.locator(`button:has-text("Add Tag")`).click();
  await page.locator('[placeholder="Type to select tag"]').click();
  await Promise.all([
    // Waits for the next request with the specified url
    page.waitForRequest('**/openmct/_all_docs?include_docs=true'),
    // Triggers the request
    page.locator(`[aria-label="Autocomplete Options"] >> text=${tagName}`).click(),
    expect(page.locator(`[aria-label="Tag"]:has-text("${tagName}")`)).toBeVisible()
  ]);
}

/**
 * Remove a tag to a notebook entry by providing a tagName.
 * Reduces indeterminism by waiting until all necessary requests are completed.
 * @param {import('@playwright/test').Page} page
 * @param {string} tagName
 */
async function removeTagAndAwaitNetwork(page, tagName) {
  await page.hover(`[aria-label="Tag"]:has-text("${tagName}")`);
  await Promise.all([
    page.locator(`[aria-label="Remove tag ${tagName}"]`).click(),
    //With this pattern, we're awaiting the response but asserting on the request payload.
    page.waitForResponse(
      (resp) => resp.request().postData().includes(`"_deleted":true`) && resp.status() === 201
    )
  ]);
  await expect(page.locator(`[aria-label="Tag"]:has-text("${tagName}")`)).toBeHidden();
}