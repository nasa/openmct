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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks.
*/

import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Snapshot Menu tests', () => {
  test.fixme(
    'When no default notebook is selected, Snapshot Menu dropdown should only have a single option',
    async ({ page }) => {
      // There should be no default notebook
      // Clear default notebook if exists using `localStorage.setItem('notebook-storage', null);`
      // refresh page
      // Click on 'Notebook Snapshot Menu'
      // 'save to Notebook Snapshots' should be only option there
    }
  );
  test.fixme(
    'When default notebook is updated selected, Snapshot Menu dropdown should list it as the newest option',
    async ({ page }) => {
      // Create 2a notebooks
      // Set Notebook A as Default
      // Open Snapshot Menu and note that Notebook A is listed
      // Close Snapshot Menu
      // Set Default Notebook to Notebook B
      // Open Snapshot Notebook and note that Notebook B is listed
      // Select Default Notebook Option and verify that Snapshot is added to Notebook B
    }
  );
  test.fixme('Can add Snapshots via Snapshot Menu and details are correct', async ({ page }) => {
    //Note this should be a visual test, too
    // Create Telemetry object
    // Create A notebook with many pages and sections.
    // Set page and section defaults to be between first and last of many. i.e. 3 of 5
    // Navigate to Telemetry object
    // Select Default Notebook Option and verify that Snapshot is added to Notebook A
    // Verify Snapshot Details appear correctly
  });
  test.fixme('Snapshots adjust time conductor', async ({ page }) => {
    // Create Telemetry object
    // Set Telemetry object's timeconductor to Fixed time with Start and End times are recorded
    // Embed Telemetry object into notebook
    // Set Time Conductor to Local clock
    // Click into embedded telemetry object and verify object appears with same fixed time from record
  });
});

test.describe('Snapshot Container tests', () => {
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Open the Notebook Snapshot Menu').click();
    await page.getByRole('menuitem', { name: 'Save to Notebook Snapshots' }).click();
    await page.getByLabel('Show Snapshots').click();
  });
  test('A snapshot can be Quick Viewed from Container with 3 dot action menu', async ({ page }) => {
    await page.getByLabel('My Items Notebook Embed').getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'Quick View' }).click();
    await expect(page.getByLabel('Modal Overlay')).toBeVisible();
    await expect(page.getByLabel('Preview Container')).toBeVisible();
  });
  test('A snapshot can be Viewed, Annotated, display deleted, and saved from Container with 3 dot action menu', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7552'
    });
    //Open Snapshot Object View
    await page.getByLabel('My Items Notebook Embed').getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'View Snapshot' }).click();
    await expect(page.getByRole('dialog', { name: 'Modal Overlay' })).toBeVisible();
    await expect(page.locator('#snapshotDescriptor')).toHaveText(
      /SNAPSHOT \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
    );
    // Open Annotation Editor with Painterro
    await page.getByLabel('Annotate this snapshot').click();
    await expect(page.locator('#snap-annotation-canvas')).toBeVisible();
    // Clear the canvas
    await page.getByRole('button', { name: 'Put text [T]' }).click();
    // Click in the Painterro canvas to add a text annotation
    await page.locator('.ptro-crp-el').click();
    await page.locator('.ptro-text-tool-input').fill('...is there life on mars?');
    // When working with Painterro, we need to check that the Apply button is hidden after clicking
    await page.getByTitle('Apply').click();
    await expect(page.getByTitle('Apply')).toBeHidden();

    // Save and exit annotation window
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Open up annotation again
    await page.getByRole('img', { name: 'My Items thumbnail' }).click();
    await expect(page.getByLabel('Modal Overlay').getByRole('img')).toBeVisible();
  });
  test('A snapshot can be Annotated and saved as a JPG and PNG', async ({ page }) => {
    //Open Snapshot Object View
    await page.getByLabel('My Items Notebook Embed').getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'View Snapshot' }).click();
    await expect(page.getByRole('dialog', { name: 'Modal Overlay' })).toBeVisible();

    // Open Annotation Editor with Painterro
    await page.getByLabel('Annotate this snapshot').click();
    await expect(page.locator('#snap-annotation-canvas')).toBeVisible();
    // Clear the canvas
    await page.getByRole('button', { name: 'Put text [T]' }).click();
    // Click in the Painterro canvas to add a text annotation
    await page.locator('.ptro-crp-el').click();
    await page.locator('.ptro-text-tool-input').fill('...is there life on mars?');
    // When working with Painterro, we need to check that the Apply button is hidden after clicking
    await page.getByTitle('Apply').click();
    await expect(page.getByTitle('Apply')).toBeHidden();

    // Save and exit annotation window
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Open up annotation again
    await page.getByRole('img', { name: 'My Items thumbnail' }).click();
    await expect(page.getByLabel('Modal Overlay').getByRole('img')).toBeVisible();

    // Save as JPG
    await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as JPG').click() // Triggers the download
    ]);

    // Save as PNG
    await expect(page.getByLabel('Modal Overlay').getByRole('img')).toBeVisible();
    await Promise.all([
      page.waitForEvent('download'), // Waits for the download event
      page.getByLabel('Export as PNG').click() // Triggers the download
    ]);
  });
  test.fixme('5 Snapshots can be added to a container', async ({ page }) => {});
  test.fixme(
    '5 Snapshots can be added to a container and Deleted with Delete All action',
    async ({ page }) => {}
  );
  test.fixme(
    'A snapshot can be Deleted from Container with 3 dot action menu',
    async ({ page }) => {}
  );
  test.fixme(
    'A snapshot can be Navigated To Item in Time from Container with 3 dot action menu',
    async ({ page }) => {}
  );
  test.fixme('A snapshot Container can be open and closed', async ({ page }) => {});
  test.fixme(
    'Can add object to Snapshot container and pull into notebook and create a new entry',
    async ({ page }) => {
      //Create Notebook
      //Create Telemetry Object
      //From Telemetry Object, use 'save to Notebook Snapshots'
      //Snapshots indicator should blink, click on it to view snapshots
      //Navigate to Notebook
      //Drag and Drop onto droppable area for new entry
      //New Entry created with given snapshot added
      //Snapshot removed from container?
    }
  );
  test.fixme(
    'Can add object to Snapshot container and pull into notebook and existing entry',
    async ({ page }) => {
      //Create Notebook
      //Create Telemetry Object
      //From Telemetry Object, use 'save to Notebook Snapshots'
      //Snapshots indicator should blink, click on it to view snapshots
      //Navigate to Notebook
      //Drag and Drop into exiting entry
      //Existing Entry updated with given snapshot
      //Snapshot removed from container?
    }
  );
});
