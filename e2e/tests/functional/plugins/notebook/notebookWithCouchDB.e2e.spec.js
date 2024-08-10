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

test.describe('Notebook Tests with CouchDB @couchdb', () => {
  let testNotebook;
  let notebookElementsRequests = [];
  test.beforeEach(async ({ page }) => {
    let findResponse;
    // Collect all request events to count and assert after notebook action
    notebookElementsRequests = [];
    page.on('request', (request) => notebookElementsRequests.push(request));
    // Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook and wait for final CouchDB response after navigation
    [testNotebook, findResponse] = await Promise.allSettled([
      createDomainObjectWithDefaults(page, { type: 'Notebook' }),
      page.waitForResponse('**/_find')
    ]);
    expect(findResponse.status).toBe('fulfilled');
  });

  test('Inspect Notebook Entry Network Requests', async ({ page }) => {
    //Ensure we're on the annotations Tab in the inspector
    await page.getByText('Annotations').click();
    // Expand sidebar
    await page.locator('.c-notebook__toggle-nav-button').click();

    notebookElementsRequests.splice(0, notebookElementsRequests.length);
    const pagePutRequest = page.waitForRequest(
      (req) => req.url().includes(`/openmct/${testNotebook.uuid}`) && req.method() === 'PUT'
    );
    const pagePostRequest = page.waitForRequest(
      (req) => req.url().includes('/openmct/_all_docs?include_docs=true') && req.method() === 'POST'
    );
    // Clicking Add Page generates
    await page.getByLabel('Add Page').click();
    const [notebookUrlRequest] = await Promise.allSettled([pagePutRequest, pagePostRequest]);
    expect(notebookUrlRequest.status).toBe('fulfilled');

    // Assert that only one PUT request is made
    // and that at least one POST request is made
    // Network Requests are:
    // 1) The actual PUT request to create the page
    // 2) The shared worker event from 👆 POST request
    expect(notebookElementsRequests.filter((req) => req.method() === 'PUT')).toHaveLength(1);
    // Depending on the order of test runs and how many objects are currently in the database,
    // the number of POST requests can vary due to batching. So check that we have at least one.
    expect(
      notebookElementsRequests.filter((req) => req.method() === 'POST').length
    ).toBeGreaterThanOrEqual(1);

    // Assert on request object
    const requestData = JSON.parse(notebookUrlRequest.value.postData());
    expect(requestData.metadata.name).toBe(testNotebook.name);
    expect(requestData.model.persisted).toBeGreaterThanOrEqual(requestData.model.modified);

    // Add an entry
    // Network Requests are:
    // 1) The actual POST to create the entry
    // 2) The shared worker event from 👆 POST request
    notebookElementsRequests = [];
    await nbUtils.enterTextEntry(page, 'First Entry');
    await page.waitForLoadState('domcontentloaded');
    expect(notebookElementsRequests.length).toBeLessThanOrEqual(2);

    // Add some tags
    // Network Requests are for each tag creation are:
    // 1) Getting the original path of the parent object
    // 2) Getting the original path of the grandparent object (recursive call)
    // 3) Creating the annotation/tag object
    // 4) The shared worker event from 👆 POST request
    // 5) Mutate notebook domain object's annotationModified property
    // 6) The shared worker event from 👆 POST request
    // 7) Notebooks fetching new annotations due to annotationModified changed
    // 8) The update of the notebook domain's object's modified property
    // 9) The shared worker event from 👆 POST request
    // 10) Entry is timestamped
    // 11) The shared worker event from 👆 POST request

    notebookElementsRequests = [];
    await addTagAndAwaitNetwork(page, 'Driving');
    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(11);

    notebookElementsRequests = [];
    await addTagAndAwaitNetwork(page, 'Drilling');
    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(11);

    notebookElementsRequests = [];
    await addTagAndAwaitNetwork(page, 'Science');
    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(11);

    // Delete all the tags
    // Network requests are:
    // 1) Send POST to mutate _delete property to true on annotation with tag
    // 2) The shared worker event from 👆 POST request
    // 3) Timestamp update on entry
    // 4) The shared worker event from 👆 POST request
    // This happens for 3 tags so 12 requests
    notebookElementsRequests = [];
    await removeTagAndAwaitNetwork(page, 'Driving');
    await removeTagAndAwaitNetwork(page, 'Drilling');
    await removeTagAndAwaitNetwork(page, 'Science');
    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(12);

    // Add two more pages
    await page.getByLabel('Add Page').click();
    await page.getByLabel('Add Page').click();

    // Add three entries
    await nbUtils.enterTextEntry(page, 'First Entry');
    await nbUtils.enterTextEntry(page, 'Second Entry');
    await nbUtils.enterTextEntry(page, 'Third Entry');

    // Add three tags
    await addTagAndAwaitNetwork(page, 'Science');
    await addTagAndAwaitNetwork(page, 'Drilling');
    await addTagAndAwaitNetwork(page, 'Driving');

    // Add a fourth entry
    // Network requests are:
    // 1) Send POST to add new entry
    // 2) The shared worker event from 👆 POST request
    // 3) Timestamp update on entry
    // 4) The shared worker event from 👆 POST request
    notebookElementsRequests = [];
    await nbUtils.enterTextEntry(page, 'Fourth Entry');
    page.waitForLoadState('domcontentloaded');

    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(4);

    // Add a fifth entry
    // Network requests are:
    // 1) Send POST to add new entry
    // 2) The shared worker event from 👆 POST request
    // 3) Timestamp update on entry
    // 4) The shared worker event from 👆 POST request
    notebookElementsRequests = [];
    await nbUtils.enterTextEntry(page, 'Fifth Entry');
    page.waitForLoadState('domcontentloaded');

    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(4);

    // Add a sixth entry
    // 1) Send POST to add new entry
    // 2) The shared worker event from 👆 POST request
    // 3) Timestamp update on entry
    // 4) The shared worker event from 👆 POST request
    notebookElementsRequests = [];
    await nbUtils.enterTextEntry(page, 'Sixth Entry');
    page.waitForLoadState('domcontentloaded');

    expect(filterNonFetchRequests(notebookElementsRequests).length).toBeLessThanOrEqual(4);
  });

  test('Search tests', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/akhenry/openmct-yamcs/issues/69'
    });
    await page.getByText('Annotations').click();
    await nbUtils.enterTextEntry(page, 'First Entry');

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
  });
});

// Try to reduce indeterminism of browser requests by only returning fetch requests.
// Filter out preflight CORS, fetching stylesheets, page icons, etc. that can occur during tests
function filterNonFetchRequests(requests) {
  return requests.filter((request) => {
    return request.resourceType() === 'fetch';
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
  await page.waitForLoadState('domcontentloaded');
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
  await page.waitForLoadState('domcontentloaded');
}
