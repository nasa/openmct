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

const { test, expect } = require('../../../../pluginFixtures');
const {
  createDomainObjectWithDefaults,
  setStartOffset,
  setFixedTimeMode,
  setRealTimeMode,
  selectInspectorTab
} = require('../../../../appActions');

test.describe('Testing LAD table configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create LAD table
    const ladTable = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });

    // Create Sine Wave Generator
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test Sine Wave Generator',
      parent: ladTable.uuid
    });

    await page.goto(ladTable.url);
  });
  test('in edit mode, LAD Tables provide ability to hide columns', async ({ page }) => {
    // Edit LAD table
    await page.locator('[title="Edit"]').click();

    // // Expand the 'My Items' folder in the left tree
    // await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // // Add the Sine Wave Generator to the LAD table and save changes
    // await page.dragAndDrop('role=treeitem[name=/Test Sine Wave Generator/]', '.c-lad-table-wrapper');
    // select configuration tab in inspector
    await selectInspectorTab(page, 'LAD Table Configuration');

    // make sure headers are visible initially
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();

    // hide timestamp column
    await page.getByLabel('Timestamp').uncheck();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();

    // hide units & type column
    await page.getByLabel('Units').uncheck();
    await page.getByLabel('Type').uncheck();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();

    // save and reload and verify they columns are still hidden
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();

    // Edit LAD table
    await page.locator('[title="Edit"]').click();
    await selectInspectorTab(page, 'LAD Table Configuration');

    // show timestamp column
    await page.getByLabel('Timestamp').check();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();

    // save and reload and make sure only timestamp is still visible
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();

    // Edit LAD table
    await page.locator('[title="Edit"]').click();
    await selectInspectorTab(page, 'LAD Table Configuration');

    // show units and type columns
    await page.getByLabel('Units').check();
    await page.getByLabel('Type').check();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();

    // save and reload and make sure all columns are still visible
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
  });

  test("LAD Tables don't allow selection of rows but does show context click menus", async ({
    page
  }) => {
    const cell = await page.locator('.js-first-data');
    const userSelectable = await cell.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('user-select');
    });

    expect(userSelectable).toBe('none');
    // Right-click on the LAD table row
    await cell.click({
      button: 'right'
    });
    const menuOptions = page.locator('.c-menu ul');
    await expect.soft(menuOptions).toContainText('View Full Datum');
    await expect.soft(menuOptions).toContainText('View Historical Data');
    await expect.soft(menuOptions).toContainText('Remove');
    // await page.locator('li[title="Remove this object from its containing object."]').click();
  });
});

test.describe('Testing LAD table @unstable', () => {
  let sineWaveObject;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await setRealTimeMode(page);

    // Create Sine Wave Generator
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test Sine Wave Generator'
    });
  });
  test('telemetry value exactly matches latest telemetry value received in real time', async ({
    page
  }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the LAD table and save changes
    await page.dragAndDrop('text=Test Sine Wave Generator', '.c-lad-table-wrapper');
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Subscribe to the Sine Wave Generator data
    // On getting data, check if the value found in the LAD table is the most recent value
    // from the Sine Wave Generator
    const getTelemValuePromise = await subscribeToTelemetry(page, sineWaveObject.uuid);
    const subscribeTelemValue = await getTelemValuePromise;
    const ladTableValuePromise = await page.waitForSelector(`text="${subscribeTelemValue}"`);
    const ladTableValue = await ladTableValuePromise.textContent();

    expect(ladTableValue).toBe(subscribeTelemValue);
  });
  test('telemetry value exactly matches latest telemetry value received in fixed time', async ({
    page
  }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the LAD table and save changes
    await page.dragAndDrop('text=Test Sine Wave Generator', '.c-lad-table-wrapper');
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Subscribe to the Sine Wave Generator data
    const getTelemValuePromise = await subscribeToTelemetry(page, sineWaveObject.uuid);
    // Set an offset of 1 minute and then change the time mode to fixed to set a 1 minute historical window
    await setStartOffset(page, { mins: '1' });
    await setFixedTimeMode(page);

    // On getting data, check if the value found in the LAD table is the most recent value
    // from the Sine Wave Generator
    const subscribeTelemValue = await getTelemValuePromise;
    const ladTableValuePromise = await page.waitForSelector(`text="${subscribeTelemValue}"`);
    const ladTableValue = await ladTableValuePromise.textContent();

    expect(ladTableValue).toBe(subscribeTelemValue);
  });
});

/**
 * Util for subscribing to a telemetry object by object identifier
 * Limitations: Currently only works to return telemetry once to the node scope
 * To Do: See if there's a way to await this multiple times to allow for multiple
 * values to be returned over time
 * @param {import('@playwright/test').Page} page
 * @param {string} objectIdentifier identifier for object
 * @returns {Promise<string>} the formatted sin telemetry value
 */
async function subscribeToTelemetry(page, objectIdentifier) {
  const getTelemValuePromise = new Promise((resolve) =>
    page.exposeFunction('getTelemValue', resolve)
  );

  await page.evaluate(async (telemetryIdentifier) => {
    const telemetryObject = await window.openmct.objects.get(telemetryIdentifier);
    const metadata = window.openmct.telemetry.getMetadata(telemetryObject);
    const formats = await window.openmct.telemetry.getFormatMap(metadata);
    window.openmct.telemetry.subscribe(telemetryObject, (obj) => {
      const sinVal = obj.sin;
      const formattedSinVal = formats.sin.format(sinVal);
      window.getTelemValue(formattedSinVal);
    });
  }, objectIdentifier);

  return getTelemValuePromise;
}
