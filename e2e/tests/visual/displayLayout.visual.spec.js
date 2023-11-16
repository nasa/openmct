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

/**
 * Defines playwright locators that can be used in tests.
 * @typedef {Object} LayoutLocators
 * @property {Object<string, import('@playwright/test').Locator>} LayoutLocator
 */

const { test } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const VISUAL_URL = require('../../constants').VISUAL_URL;
const percySnapshot = require('@percy/playwright');
const snapshotScope = '.l-shell__pane-main .l-pane__contents';

test.describe('Visual - Display Layout', () => {
  test('Resize Marquee surrounds selection', async ({ page, theme }) => {
    const baseline = await setupBaseline(page);
    const { child1LayoutLocator, child1LayoutObjectLocator } = baseline;

    await percySnapshot(page, `Resize nested layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });

    await child1LayoutLocator.click();
    await percySnapshot(page, `Resize new nested layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });

    await child1LayoutObjectLocator.click();
    await percySnapshot(page, `Resize Object in nested layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });
  });

  test('Parent layout of selection displays grid', async ({ page, theme }) => {
    const baseline = await setupBaseline(page);
    const { parentLayoutLocator, child1LayoutObjectLocator } = baseline;

    await percySnapshot(page, `Parent nested layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });

    await parentLayoutLocator.click();
    await percySnapshot(page, `Parent outer layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });

    await child1LayoutObjectLocator.click();
    await percySnapshot(page, `Parent Object in nested layout selected (theme: '${theme}')`, {
      scope: snapshotScope
    });
  });
});

/**
 * Sets up a complex layout with nested layouts and provides the playwright locators
 * @param {import('@playwright/test').Page} page
 * @returns {LayoutLocators} locators of baseline complex display to be used in tests
 */
async function setupBaseline(page) {
  // Load Open MCT visual test baseline
  await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  // Open Tree
  await page.getByRole('button', { name: 'Browse' }).click();

  const treePane = page.getByRole('tree', {
    name: 'Main Tree'
  });

  const objectViewLocator = page.locator('.c-object-view');
  const parentLayoutLocator = objectViewLocator.first();
  const child1LayoutLocator = parentLayoutLocator.locator(objectViewLocator).first();
  const child1LayoutObjectLocator = child1LayoutLocator.locator('.l-layout__frame');
  const parentLayout = await createDomainObjectWithDefaults(page, {
    type: 'Display Layout',
    name: 'Parent Layout'
  });
  const child1Layout = await createDomainObjectWithDefaults(page, {
    type: 'Display Layout',
    name: 'Child 1 Layout'
  });
  const child2Layout = await createDomainObjectWithDefaults(page, {
    type: 'Display Layout',
    name: 'Child 2 Layout'
  });
  const swg1 = await createDomainObjectWithDefaults(page, {
    type: 'Sine Wave Generator',
    name: 'SWG 1'
  });
  const swg2 = await createDomainObjectWithDefaults(page, {
    type: 'Sine Wave Generator',
    name: 'SWG 2'
  });
  const child1LayoutTreeItem = treePane.getByRole('treeitem', {
    name: new RegExp(child1Layout.name)
  });
  const child2LayoutTreeItem = treePane.getByRole('treeitem', {
    name: new RegExp(child2Layout.name)
  });
  const swg1TreeItem = treePane.getByRole('treeitem', {
    name: new RegExp(swg1.name)
  });
  const swg2TreeItem = treePane.getByRole('treeitem', {
    name: new RegExp(swg2.name)
  });

  // Expand folder containing created objects
  await page.goto(parentLayout.url);
  await page.getByTitle('Show selected item in tree').click();

  // Add swg1 to child1Layout
  await page.goto(child1Layout.url);
  await page.getByRole('button', { name: 'Edit' }).click();
  await swg1TreeItem.dragTo(parentLayoutLocator, { targetPosition: { x: 0, y: 0 } });
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

  // Add swg1 to child1Layout
  await page.goto(child2Layout.url);
  await page.getByRole('button', { name: 'Edit' }).click();
  await swg2TreeItem.dragTo(parentLayoutLocator, { targetPosition: { x: 0, y: 0 } });
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

  // Add child1Layout and child2Layout to parentLayout
  await page.goto(parentLayout.url);
  await page.getByRole('button', { name: 'Edit' }).click();
  await child1LayoutTreeItem.dragTo(parentLayoutLocator, { targetPosition: { x: 350, y: 0 } });
  await child2LayoutTreeItem.dragTo(parentLayoutLocator, { targetPosition: { x: 0, y: 0 } });

  return {
    parentLayoutLocator,
    child1LayoutLocator,
    child1LayoutObjectLocator
  };
}
