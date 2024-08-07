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

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithRealTime,
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Testing LAD table configuration', () => {
  let ladTable;
  let sineWaveObject;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create LAD table
    ladTable = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });

    // Create Sine Wave Generator
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test Sine Wave Generator',
      parent: ladTable.uuid
    });

    await page.goto(ladTable.url);
  });
  test('in edit mode, LAD Tables provide ability to hide columns', async ({ page }) => {
    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // make sure headers are visible initially
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // hide timestamp column
    await page.getByLabel('Timestamp', { exact: true }).uncheck();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // hide units & type column
    await page.getByLabel('Units').uncheck();
    await page.getByLabel('Type', { exact: true }).uncheck();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // hide WATCH column
    await page.getByLabel('WATCH').uncheck();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // save and reload and verify they columns are still hidden
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // show timestamp column
    await page.getByLabel('Timestamp', { exact: true }).check();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // save and reload and make sure timestamp is still visible
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // show units, type, and WATCH columns
    await page.getByLabel('Units').check();
    await page.getByLabel('Type', { exact: true }).check();
    await page.getByLabel('WATCH').check();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // save and reload and make sure all columns are still visible
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
  });

  test('When adding something without Units, do not show Units column', async ({ page }) => {
    // Create Sine Wave Generator
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: ladTable.uuid
    });

    await page.goto(ladTable.url);

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // make sure Sine Wave headers are visible initially too
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();

    // save and reload and verify they columns are still hidden
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Remove Sine Wave Generator
    openObjectTreeContextMenu(page, sineWaveObject.url);
    await page.getByRole('menuitem', { name: /Remove/ }).click();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    // Ensure Units & Limit columns are gone
    // as Event Generator don't have them
    await page.goto(ladTable.url);
    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeHidden();
    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeHidden();
  });

  test("LAD Tables don't allow selection of rows but does show context click menus", async ({
    page
  }) => {
    const cell = page.locator('.js-first-data');
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

test.describe('Testing LAD table', () => {
  let sineWaveObject;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Sine Wave Generator
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test Sine Wave Generator'
    });

    // Switch to real time mode by navigating directly to the URL
    await navigateToObjectWithRealTime(page, sineWaveObject.url);
  });
  test('telemetry value exactly matches latest telemetry value received in realtime mode', async ({
    page
  }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.getByLabel('Edit Object').click();

    // Expand the 'My Items' folder in the left tree
    await page.getByLabel('Expand My Items').click();
    // Add the Sine Wave Generator to the LAD table and save changes
    await page.getByLabel('Preview Test Sine Wave').dragTo(page.locator('#lad-table-drop-area'));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Subscribe to the Sine Wave Generator data
    // On getting data, check if the value found in the LAD table is the most recent value
    // from the Sine Wave Generator
    const getTelemValuePromise = subscribeToTelemetry(page, sineWaveObject.uuid);
    const subscribeTelemValue = await getTelemValuePromise;
    await expect(page.getByLabel('lad value')).toHaveText(subscribeTelemValue);
    const ladTableValue = await page.getByText(subscribeTelemValue).textContent();

    expect(ladTableValue).toEqual(subscribeTelemValue);
  });
  test('telemetry value exactly matches latest telemetry value received in fixed time mode', async ({
    page
  }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.getByLabel('Edit Object').click();

    // Expand the 'My Items' folder in the left tree
    await page.getByLabel('Expand My Items').click();
    // Add the Sine Wave Generator to the LAD table and save changes
    await page.getByLabel('Preview Test Sine Wave').dragTo(page.locator('#lad-table-drop-area'));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Subscribe to the Sine Wave Generator data
    const getTelemValuePromise = subscribeToTelemetry(page, sineWaveObject.uuid);
    // Set an offset of 1 minute and then change the time mode to fixed to set a 1 minute historical window
    await setRealTimeMode(page);
    await setStartOffset(page, { startMins: '01' });
    await setFixedTimeMode(page);

    // On getting data, check if the value found in the LAD table is the most recent value
    // from the Sine Wave Generator
    const subscribeTelemValue = await getTelemValuePromise;
    await expect(page.getByLabel('lad value')).toHaveText(subscribeTelemValue);
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

/**
 * Open the given `domainObject`'s context menu from the object tree.
 * Expands the path to the object and scrolls to it if necessary.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url the url to the object
 */
async function openObjectTreeContextMenu(page, url) {
  await page.goto(url);
  await page.getByLabel('Show selected item in tree').click();
  await page.locator('.is-navigated-object').click({
    button: 'right'
  });
}
