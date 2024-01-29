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
/**
 * This test suite is dedicated to tests which verify search functionalities.
 */

import { v4 as uuid } from 'uuid';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Grand Search', () => {
  let grandSearchInput;

  test.beforeEach(async ({ page }) => {
    grandSearchInput = page
      .getByLabel('OpenMCT Search')
      .getByRole('searchbox', { name: 'Search Input' });

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Can search for objects, and subsequent search dropdown behaves properly', async ({
    page,
    openmctConfig
  }) => {
    const { myItemsFolderName } = openmctConfig;

    const createdObjects = await createObjectsForSearch(page);

    // Go back into edit mode for the display layout
    await page.getByRole('button', { name: 'Edit Object' }).click();

    await grandSearchInput.click();
    await grandSearchInput.fill('Cl');

    await expect(page.getByLabel('Object Search Result').first()).toContainText(
      `Clock A ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(1)).toContainText(
      `Clock B ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(2)).toContainText(
      `Clock C ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(3)).toContainText(
      `Clock D ${myItemsFolderName} Red Folder Blue Folder`
    );
    // Click the Elements pool to dismiss the search menu
    await page.getByRole('tab', { name: 'Elements' }).click();
    await expect(page.getByLabel('Object Search Result').first()).toBeHidden();

    await grandSearchInput.click();
    await page.getByLabel('OpenMCT Search').getByText('Clock A').click();
    await expect(page.getByRole('dialog', { name: 'Preview Container' })).toBeVisible();

    // Close the Preview window
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByLabel('Object Search Result').first()).toBeVisible();
    await expect(page.getByLabel('Object Search Result').first()).toContainText(
      `Clock A ${myItemsFolderName} Red Folder Blue Folder`
    );

    await page.getByLabel('Object Search Result').first().click();
    await expect(page.getByLabel('Object Search Result').first()).toBeHidden();

    await grandSearchInput.fill('foo');
    await expect(page.getByLabel('Object Search Result').first()).toBeHidden();

    // Click text=Snapshot Save and Finish Editing Save and Continue Editing >> button >> nth=1
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    // Click [aria-label="OpenMCT Search"] [aria-label="Search Input"]
    await grandSearchInput.click();
    // Fill [aria-label="OpenMCT Search"] [aria-label="Search Input"]
    await grandSearchInput.fill('Cl');
    await Promise.all([
      page.waitForNavigation(),
      page.getByLabel('OpenMCT Search').getByText('Clock A').click()
    ]);
    await expect(page.getByRole('status', { name: 'Clock', exact: true })).toBeVisible();

    await grandSearchInput.fill('Disp');
    await expect(page.getByLabel('Object Search Result').first()).toContainText(
      createdObjects.displayLayout.name
    );
    await expect(page.getByLabel('Object Search Result').first()).not.toContainText('Folder');

    await grandSearchInput.fill('Clock C');
    await expect(page.getByLabel('Object Search Result').first()).toContainText(
      `Clock C ${myItemsFolderName} Red Folder Blue Folder`
    );

    await grandSearchInput.fill('Cloc');
    await expect(page.getByLabel('Object Search Result').first()).toContainText(
      `Clock A ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(1)).toContainText(
      `Clock B ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(2)).toContainText(
      `Clock C ${myItemsFolderName} Red Folder Blue Folder`
    );
    await expect(page.getByLabel('Object Search Result').nth(3)).toContainText(
      `Clock D ${myItemsFolderName} Red Folder Blue Folder`
    );

    await grandSearchInput.click();
    await grandSearchInput.fill('Sine');
  });

  test('Clicking on a search result changes the URL even if the same type is already selected', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7303'
    });

    const { sineWaveGeneratorAlpha, sineWaveGeneratorBeta } = await createObjectsForSearch(page);
    await grandSearchInput.click();
    await grandSearchInput.fill('Sine');
    await waitForSearchCompletion(page);
    await page.getByLabel('OpenMCT Search').getByText('Sine Wave Generator Alpha').click();
    const alphaPattern = new RegExp(sineWaveGeneratorAlpha.url.substring(1));
    await expect(page).toHaveURL(alphaPattern);
    await grandSearchInput.click();
    await page.getByLabel('OpenMCT Search').getByText('Sine Wave Generator Beta').click();
    const betaPattern = new RegExp(sineWaveGeneratorBeta.url.substring(1));
    await expect(page).toHaveURL(betaPattern);
  });

  test('Validate empty search result', async ({ page }) => {
    // Invalid search for objects
    await grandSearchInput.fill('not found');

    // Wait for search to complete
    await waitForSearchCompletion(page);

    // Get the search results
    const searchResults = page.getByRole('listitem', { name: 'Object Search Result' });

    // Verify that no results are found
    expect(await searchResults.count()).toBe(0);

    // Verify proper message appears
    await expect(page.getByText('No results found')).toBeVisible();
  });

  test('Validate single object in search result @couchdb', async ({ page }) => {
    // Create a folder object
    const folderName = uuid();
    await createDomainObjectWithDefaults(page, {
      type: 'folder',
      name: folderName
    });

    // Full search for object
    await grandSearchInput.fill(folderName);

    // Wait for search to complete
    await waitForSearchCompletion(page);

    // Get the search results
    const searchResults = page.getByLabel('Object Search Result');

    // Verify that one result is found
    await expect(searchResults).toBeVisible();
    expect(await searchResults.count()).toBe(1);
    await expect(searchResults).toContainText(folderName);
  });

  test('Search results are debounced @couchdb', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6179'
    });
    await createObjectsForSearch(page);

    let networkRequests = [];
    page.on('request', (request) => {
      const searchRequest =
        request.url().endsWith('_find') || request.url().includes('by_keystring');
      const fetchRequest = request.resourceType() === 'fetch';
      if (searchRequest && fetchRequest) {
        networkRequests.push(request);
      }
    });

    // Full search for object
    await grandSearchInput.pressSequentially('Clock', { delay: 100 });

    // Wait for search to finish
    await waitForSearchCompletion(page);

    // Network requests for the composite telemetry with multiple items should be:
    // 1.  batched request for latest telemetry using the bulk API
    expect(networkRequests.length).toBe(1);

    await expect(page.getByRole('list', { name: 'Object Results' })).toContainText('Clock A');
  });

  test('Slowly typing after search debounce will abort requests @couchdb', async ({ page }) => {
    let requestWasAborted = false;
    await createObjectsForSearch(page);
    page.on('requestfailed', (request) => {
      // check if the request was aborted
      if (request.failure().errorText === 'net::ERR_ABORTED') {
        requestWasAborted = true;
      }
    });

    // Intercept and delay request
    const delayInMs = 100;

    await page.route('**', async (route, request) => {
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
      route.continue();
    });

    // Slowly type after search delay
    const searchInput = page.getByRole('searchbox', { name: 'Search Input' });
    await searchInput.pressSequentially('Clock', { delay: 200 });
    await expect(page.getByText('Clock B').first()).toBeVisible();

    expect(requestWasAborted).toBe(true);
  });

  test('Validate multiple objects in search results return partial matches', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/4667'
    });

    // Create folder objects
    const folderName1 = 'e928a26e-e924-4ea0';
    const folderName2 = 'e928a26e-e924-4001';

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: folderName1
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: folderName2
    });

    // Partial search for objects
    await grandSearchInput.fill('e928a26e');

    // Wait for search to finish
    await waitForSearchCompletion(page);

    const searchResultDropDown = page.getByRole('dialog', { name: 'Search Results' });

    // Verify that the search result/s correctly match the search query
    await expect(searchResultDropDown).toContainText(folderName1);
    await expect(searchResultDropDown).toContainText(folderName2);

    // Get the search results
    const objectSearchResults = page.getByLabel('Object Search Result');
    // Verify that two results are found
    expect(await objectSearchResults.count()).toBe(2);
  });
});

/**
 * Wait for search to complete
 *
 * @param {import('@playwright/test').Page} page
 */
async function waitForSearchCompletion(page) {
  // Wait loading spinner to disappear
  await expect(
    page
      .getByRole('list', { name: 'Object Results' })
      .or(
        page
          .getByRole('list', { name: 'Annotation Results' })
          .or(page.getByText('No results found'))
      )
  ).toBeVisible();
}

/**
 * Creates some domain objects for searching
 * @param {import('@playwright/test').Page} page
 */
async function createObjectsForSearch(page) {
  const redFolder = await createDomainObjectWithDefaults(page, {
    type: 'Folder',
    name: 'Red Folder'
  });

  const blueFolder = await createDomainObjectWithDefaults(page, {
    type: 'Folder',
    name: 'Blue Folder',
    parent: redFolder.uuid
  });

  const clockA = await createDomainObjectWithDefaults(page, {
    type: 'Clock',
    name: 'Clock A',
    parent: blueFolder.uuid
  });
  const clockB = await createDomainObjectWithDefaults(page, {
    type: 'Clock',
    name: 'Clock B',
    parent: blueFolder.uuid
  });
  const clockC = await createDomainObjectWithDefaults(page, {
    type: 'Clock',
    name: 'Clock C',
    parent: blueFolder.uuid
  });
  const clockD = await createDomainObjectWithDefaults(page, {
    type: 'Clock',
    name: 'Clock D',
    parent: blueFolder.uuid
  });

  const sineWaveGeneratorAlpha = await createDomainObjectWithDefaults(page, {
    type: 'Sine Wave Generator',
    name: 'Sine Wave Generator Alpha'
  });

  const sineWaveGeneratorBeta = await createDomainObjectWithDefaults(page, {
    type: 'Sine Wave Generator',
    name: 'Sine Wave Generator Beta'
  });

  const displayLayout = await createDomainObjectWithDefaults(page, {
    type: 'Display Layout'
  });

  return {
    redFolder,
    blueFolder,
    clockA,
    clockB,
    clockC,
    clockD,
    displayLayout,
    sineWaveGeneratorAlpha,
    sineWaveGeneratorBeta
  };
}
