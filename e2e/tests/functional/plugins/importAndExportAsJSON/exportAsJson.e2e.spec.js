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
This test suite is dedicated to tests which verify the basic operations surrounding exportAsJSON.
*/

import fs from 'fs/promises';

import {
  createDomainObjectWithDefaults,
  openObjectTreeContextMenu
} from '../../../../appActions.js';
import { expect, test } from '../../../../baseFixtures.js';
import { navigateToFaultManagementWithExample } from '../../../../helper/faultUtils.js';

test.describe('ExportAsJSON', () => {
  let folder;
  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto('./');
    // Perform actions to create the domain object
    folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'e2e folder'
    });
  });
  test('Create a basic object and verify that it can be exported as JSON from Tree', async ({
    page
  }) => {
    // Navigate to the page
    await page.goto(folder.url);

    // Open context menu and initiate download
    await openObjectTreeContextMenu(page, folder.url);
    const [download] = await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JSON').click() // Triggers the download
    ]);

    // Wait for the download process to complete
    const path = await download.path();

    // Read the contents of the downloaded file using readFile from fs/promises
    const fileContents = await fs.readFile(path, 'utf8');
    const jsonData = JSON.parse(fileContents);

    // Use the function to retrieve the key
    const key = getFirstKeyFromOpenMctJson(jsonData);

    // Verify the contents of the JSON file
    expect(jsonData.openmct[key]).toHaveProperty('name', 'e2e folder');
    expect(jsonData.openmct[key]).toHaveProperty('type', 'folder');
  });
  test('Create a basic object and verify that it can be exported as JSON from 3 dot menu', async ({
    page
  }) => {
    // Navigate to the page
    await page.goto(folder.url);
    //3 dot menu
    await page.getByLabel('More actions').click();
    // Open context menu and initiate download
    const [download] = await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JSON').click() // Triggers the download
    ]);

    // Read the contents of the downloaded file using readFile from fs/promises
    const fileContents = await fs.readFile(await download.path(), 'utf8');
    const jsonData = JSON.parse(fileContents);

    // Use the function to retrieve the key
    const key = getFirstKeyFromOpenMctJson(jsonData);

    // Verify the contents of the JSON file
    expect(jsonData.openmct[key]).toHaveProperty('name', 'e2e folder');
    expect(jsonData.openmct[key]).toHaveProperty('type', 'folder');
  });
  test('Verify that a nested Object can be exported as JSON', async ({ page }) => {
    const timer = await createDomainObjectWithDefaults(page, {
      type: 'Timer',
      name: 'timer',
      parent: folder.uuid
    });
    // Navigate to the page
    await page.goto(timer.url);

    //do this against parent folder.url, NOT timer.url child
    await openObjectTreeContextMenu(page, folder.url);
    // Open context menu and initiate download
    const [download] = await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JSON').click() // Triggers the download
    ]);

    // Read the contents of the downloaded file
    const fileContents = await fs.readFile(await download.path(), 'utf8');
    const jsonData = JSON.parse(fileContents);

    // Retrieve the keys for folder and timer
    const folderKey = getFirstKeyFromOpenMctJson(jsonData);
    const timerKey = jsonData.openmct[folderKey].composition[0].key;

    // Verify the folder properties
    expect(jsonData.openmct[folderKey]).toHaveProperty('name', 'e2e folder');
    expect(jsonData.openmct[folderKey]).toHaveProperty('type', 'folder');

    // Verify the timer properties
    expect(jsonData.openmct[timerKey]).toHaveProperty('name', 'timer');
    expect(jsonData.openmct[timerKey]).toHaveProperty('type', 'timer');

    // Verify the composition of the folder includes the timer
    expect(jsonData.openmct[folderKey].composition).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: timerKey })])
    );
  });
});
test.describe('ExportAsJSON Disabled Actions', () => {
  test.beforeEach(async ({ page }) => {
    //Use a Fault Management Object which is not composable
    await navigateToFaultManagementWithExample(page);
  });
  test('Verify that the ExportAsJSON dropdown does not appear for the item X', async ({ page }) => {
    await page.getByLabel('More actions').click();
    await expect(await page.getByLabel('Export as JSON')).toHaveCount(0);

    await page.getByRole('treeitem', { name: 'Fault Management' }).click({
      button: 'right'
    });
    await expect(await page.getByLabel('Export as JSON')).toHaveCount(0);
  });
});
test.describe('ExportAsJSON ProgressBar @couchdb', () => {
  let folder;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'networkidle' });
    // Perform actions to create the domain object
    folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Timer',
      parent: folder.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Timer',
      parent: folder.uuid
    });
  });
  test('Verify that the ExportAsJSON action creates a progressbar', async ({ page }) => {
    // Navigate to the page
    await page.goto(folder.url);

    //Export My Items to create a large export
    await page.getByRole('treeitem', { name: 'My Items' }).click({ button: 'right' });
    // Open context menu and initiate download
    await Promise.all([
      page.getByRole('progressbar'), // This is just a check for the progress bar
      page.getByText(
        'Do not navigate away from this page or close this browser tab while this message'
      ), // This is the text associated with the download
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JSON').click() // Triggers the download
    ]);
  });
});

/**
 * Retrieves the first key from the 'openmct' property of the provided JSON object.
 *
 * @param {Object} jsonData - The JSON object containing the 'openmct' property.
 * @returns {string} The first key found in the 'openmct' object.
 * @throws {Error} If no keys are found in the 'openmct' object.
 */
function getFirstKeyFromOpenMctJson(jsonData) {
  if (!jsonData.openmct) {
    throw new Error("The provided JSON object does not have an 'openmct' property.");
  }

  const keys = Object.keys(jsonData.openmct);
  if (keys.length === 0) {
    throw new Error('No keys found in the openmct object');
  }

  return keys[0];
}
