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
/* global __dirname */
/*
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks.
*/

const fs = require('fs').promises;
const path = require('path');
const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

const NOTEBOOK_NAME = 'Notebook';

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

    // Create Notebook
    // const notebook = await createDomainObjectWithDefaults(page, {
    //     type: 'Notebook',
    //     name: "Test Notebook"
    // });
    // // Create Overlay Plot
    // const snapShotObject = await createDomainObjectWithDefaults(page, {
    //     type: 'Overlay Plot',
    //     name: "Dropped Overlay Plot"
    // });

    await page.getByRole('button', { name: ' Snapshot ' }).click();
    await page.getByRole('menuitem', { name: ' Save to Notebook Snapshots' }).click();
    await page.getByRole('button', { name: 'Show' }).click();
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
    'A snapshot can be Viewed, Annotated, display deleted, and saved from Container with 3 dot action menu',
    async ({ page }) => {
      await page.locator('.c-snapshot.c-ne__embed').first().getByTitle('More options').click();
      await page.getByRole('menuitem', { name: ' View Snapshot' }).click();
      await expect(page.locator('.c-overlay__outer')).toBeVisible();
      await page.getByTitle('Annotate').click();
      await expect(page.locator('#snap-annotation-canvas')).toBeVisible();
      await page.getByRole('button', { name: '' }).click();
      // await expect(page.locator('#snap-annotation-canvas')).not.toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.getByRole('button', { name: 'Done' }).click();
      //await expect(await page.locator)
    }
  );
  test('A snapshot can be Quick Viewed from Container with 3 dot action menu', async ({ page }) => {
    await page.locator('.c-snapshot.c-ne__embed').first().getByTitle('More options').click();
    await page.getByRole('menuitem', { name: 'Quick View' }).click();
    await expect(page.locator('.c-overlay__outer')).toBeVisible();
  });
  test.fixme(
    'A snapshot can be Navigated To from Container with 3 dot action menu',
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
  test.fixme(
    'Verify Embedded options for PNG, JPG, and Annotate work correctly',
    async ({ page }) => {
      //Add snapshot to container
      //Verify PNG, JPG, and Annotate buttons work correctly
    }
  );
});

test.describe('Snapshot image tests', () => {
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });

  test('Can drop an image onto a notebook and create a new entry', async ({ page }) => {
    const imageData = await fs.readFile(
      path.resolve(__dirname, '../../../../../src/images/favicons/favicon-96x96.png')
    );
    const imageArray = new Uint8Array(imageData);
    const fileData = Array.from(imageArray);

    const dropTransfer = await page.evaluateHandle((data) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'favicon-96x96.png', { type: 'image/png' });
      dataTransfer.items.add(file);
      return dataTransfer;
    }, fileData);

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: dropTransfer });
    await page.locator('.c-ne__save-button > button').click();
    // be sure that entry was created
    await expect(page.getByText('favicon-96x96.png')).toBeVisible();

    await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).click();
    // expect large image to be displayed
    await expect(page.getByRole('dialog').getByText('favicon-96x96.png')).toBeVisible();

    await page.getByLabel('Close').click();

    // drop another image onto the entry
    await page.dispatchEvent('.c-snapshots', 'drop', { dataTransfer: dropTransfer });

    const secondThumbnail = page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).nth(1);
    await secondThumbnail.waitFor({ state: 'attached' });
    // expect two embedded images now
    expect(await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).count()).toBe(2);

    await page.locator('.c-snapshot.c-ne__embed').first().getByTitle('More options').click();

    await page.getByRole('menuitem', { name: /Remove This Embed/ }).click();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();
    // Ensure that the thumbnail is removed before we assert
    await secondThumbnail.waitFor({ state: 'detached' });

    // expect one embedded image now as we deleted the other
    expect(await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).count()).toBe(1);
  });
});

test.describe('Snapshot image failure tests', () => {
  test.use({ failOnConsoleError: false });
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });

  test('Get an error notification when dropping unknown file onto notebook entry', async ({
    page
  }) => {
    // fill Uint8Array array with some garbage data
    const garbageData = new Uint8Array(100);
    const fileData = Array.from(garbageData);

    const dropTransfer = await page.evaluateHandle((data) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'someGarbage.foo', { type: 'unknown/garbage' });
      dataTransfer.items.add(file);
      return dataTransfer;
    }, fileData);

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: dropTransfer });

    // should have gotten a notification from OpenMCT that we couldn't add it
    await expect(page.getByText('Unknown object(s) dropped and cannot embed')).toBeVisible();
  });

  test('Get an error notification when dropping big files onto notebook entry', async ({
    page
  }) => {
    const garbageSize = 15 * 1024 * 1024; // 15 megabytes

    await page.addScriptTag({
      // make the garbage client side
      content: `window.bigGarbageData = new Uint8Array(${garbageSize})`
    });

    const bigDropTransfer = await page.evaluateHandle(() => {
      const dataTransfer = new DataTransfer();
      const file = new File([window.bigGarbageData], 'bigBoy.png', { type: 'image/png' });
      dataTransfer.items.add(file);
      return dataTransfer;
    });

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: bigDropTransfer });

    // should have gotten a notification from OpenMCT that we couldn't add it as it's too big
    await expect(page.getByText('unable to embed')).toBeVisible();
  });
});
