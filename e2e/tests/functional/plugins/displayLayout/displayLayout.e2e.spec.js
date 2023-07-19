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
  setRealTimeMode
} = require('../../../../appActions');

test.describe('Display Layout', () => {
  /** @type {import('../../../../appActions').CreatedObjectInfo} */
  let sineWaveObject;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await setRealTimeMode(page);

    // Create Sine Wave Generator
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });
  });
  test('alpha-numeric widget telemetry value exactly matches latest telemetry value received in real time', async ({
    page
  }) => {
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    const layoutGridHolder = page.locator('.l-layout__grid-holder');
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder);
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Subscribe to the Sine Wave Generator data
    // On getting data, check if the value found in the  Display Layout is the most recent value
    // from the Sine Wave Generator
    const getTelemValuePromise = await subscribeToTelemetry(page, sineWaveObject.uuid);
    const formattedTelemetryValue = getTelemValuePromise;
    const displayLayoutValuePromise = await page.waitForSelector(
      `text="${formattedTelemetryValue}"`
    );
    const displayLayoutValue = await displayLayoutValuePromise.textContent();
    const trimmedDisplayValue = displayLayoutValue.trim();

    expect(trimmedDisplayValue).toBe(formattedTelemetryValue);
  });
  test('alpha-numeric widget telemetry value exactly matches latest telemetry value received in fixed time', async ({
    page
  }) => {
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    const layoutGridHolder = page.locator('.l-layout__grid-holder');
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder);
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Subscribe to the Sine Wave Generator data
    const getTelemValuePromise = await subscribeToTelemetry(page, sineWaveObject.uuid);
    // Set an offset of 1 minute and then change the time mode to fixed to set a 1 minute historical window
    await setStartOffset(page, { mins: '1' });
    await setFixedTimeMode(page);

    // On getting data, check if the value found in the Display Layout is the most recent value
    // from the Sine Wave Generator
    const formattedTelemetryValue = getTelemValuePromise;
    const displayLayoutValuePromise = await page.waitForSelector(
      `text="${formattedTelemetryValue}"`
    );
    const displayLayoutValue = await displayLayoutValuePromise.textContent();
    const trimmedDisplayValue = displayLayoutValue.trim();

    expect(trimmedDisplayValue).toBe(formattedTelemetryValue);
  });
  test('items in a display layout can be removed with object tree context menu when viewing the display layout', async ({
    page
  }) => {
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    const layoutGridHolder = page.locator('.l-layout__grid-holder');
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder);
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    expect.soft(await page.locator('.l-layout .l-layout__frame').count()).toEqual(1);

    // Expand the Display Layout so we can remove the sine wave generator
    await page.locator('.c-tree__item.is-navigated-object .c-disclosure-triangle').click();

    // Bring up context menu and remove
    await sineWaveGeneratorTreeItem.nth(1).click({ button: 'right' });
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();
    await page.locator('button:has-text("OK")').click();

    // delete

    expect(await page.locator('.l-layout .l-layout__frame').count()).toEqual(0);
  });
  test('items in a display layout can be removed with object tree context menu when viewing another item', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/3117'
    });
    // Create a Display Layout
    const displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    const layoutGridHolder = page.locator('.l-layout__grid-holder');
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder);
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    expect.soft(await page.locator('.l-layout .l-layout__frame').count()).toEqual(1);

    // Expand the Display Layout so we can remove the sine wave generator
    await page.locator('.c-tree__item.is-navigated-object .c-disclosure-triangle').click();

    // Go to the original Sine Wave Generator to navigate away from the Display Layout
    await page.goto(sineWaveObject.url);

    // Bring up context menu and remove
    await sineWaveGeneratorTreeItem.first().click({ button: 'right' });
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();
    await page.locator('button:has-text("OK")').click();

    // navigate back to the display layout to confirm it has been removed
    await page.goto(displayLayout.url);

    expect(await page.locator('.l-layout .l-layout__frame').count()).toEqual(0);
  });

  test('independent time works with display layouts and its children', async ({ page }) => {
    await setFixedTimeMode(page);
    // Create Example Imagery
    const exampleImageryObject = await createDomainObjectWithDefaults(page, {
      type: 'Example Imagery'
    });
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const exampleImageryTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(exampleImageryObject.name)
    });
    let layoutGridHolder = page.locator('.l-layout__grid-holder');
    await exampleImageryTreeItem.dragTo(layoutGridHolder);

    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // flip on independent time conductor
    await page.getByTitle('Enable independent Time Conductor').first().locator('label').click();
    await page.getByRole('textbox').nth(1).fill('2021-12-30 01:11:00.000Z');
    await page.getByRole('textbox').nth(0).fill('2021-12-30 01:01:00.000Z');
    await page.getByRole('textbox').nth(1).click();

    // check image date
    await expect(page.getByText('2021-12-30 01:11:00.000Z').first()).toBeVisible();

    // flip it off
    await page.getByTitle('Disable independent Time Conductor').first().locator('label').click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();
  });

  test('When multiple plots are contained in a layout, we only ask for annotations once @couchdb', async ({
    page
  }) => {
    // Create another Sine Wave Generator
    const anotherSineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });

    let layoutGridHolder = page.locator('.l-layout__grid-holder');
    // eslint-disable-next-line playwright/no-force-option
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder, { force: true });

    await page.getByText('View type').click();
    await page.getByText('Overlay Plot').click();

    const anotherSineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(anotherSineWaveObject.name)
    });
    layoutGridHolder = page.locator('.l-layout__grid-holder');
    // eslint-disable-next-line playwright/no-force-option
    await anotherSineWaveGeneratorTreeItem.dragTo(layoutGridHolder, { force: true });

    await page.getByText('View type').click();
    await page.getByText('Overlay Plot').click();

    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Time to inspect some network traffic
    let networkRequests = [];
    page.on('request', (request) => {
      const searchRequest = request.url().endsWith('_find');
      const fetchRequest = request.resourceType() === 'fetch';
      if (searchRequest && fetchRequest) {
        networkRequests.push(request);
      }
    });

    await page.reload();

    // wait for annotations requests to be batched and requested
    await page.waitForLoadState('networkidle');

    // Network requests for the composite telemetry with multiple items should be:
    // 1.  a single batched request for annotations
    expect(networkRequests.length).toBe(1);
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
