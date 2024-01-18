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

import fs from 'fs';

import {
  createDomainObjectWithDefaults,
  openObjectTreeContextMenu
} from '../../../../appActions.js';
import { expect, test } from '../../../../baseFixtures.js';

test.describe('ExportAsJSON', () => {
  test('Create a basic object and verify that it can be exported as JSON from Tree', async ({
    page,
    browser
  }) => {
    // // Set up a download path
    // const context = await browser.newContext({
    //   acceptDownloads: true
    // });
    // const page = await context.newPage();

    // Navigate to the page
    await page.goto('./');

    // Perform actions to create the domain object
    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'e2e folder'
    });

    // Open context menu and initiate download
    await openObjectTreeContextMenu(page, folder.url);
    const [download] = await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JSON').click() // Triggers the download
    ]);

    // Wait for the download process to complete
    const path = await download.path();

    // Read the contents of the downloaded file
    const fileContents = await fs.promises.readFile(path, 'utf8');

    // Verify the contents of the file (this is just an example, adjust as needed)
    expect(fileContents).toContain('"name": "e2e folder"');
    expect(fileContents).toContain('"type": "Folder"');

    // Clean up: Close the page and context
    await page.close();
  });
  test.fixme(
    'Create a basic object and verify that it can be exported as JSON from 3 dot menu',
    async ({ page }) => {
      //Create domain object
      //Save Domain Object
      //Verify that the newly created domain object can be exported as JSON from the 3 dot menu
    }
  );
  test.fixme('Verify that a nested Object can be exported as JSON', async ({ page }) => {
    // Create 2 objects with hierarchy
    // Export as JSON
    // Verify Hierarchy
  });
  test.fixme(
    'Verify that the ExportAsJSON dropdown does not appear for the item X',
    async ({ page }) => {
      // Other than non-persistable objects
    }
  );
});
