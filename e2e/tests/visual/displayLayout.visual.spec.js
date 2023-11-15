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

const { test } = require('../../pluginFixtures');
const { expandTreePaneItemByName, createDomainObjectWithDefaults } = require('../../appActions');
const VISUAL_URL = require('../../constants').VISUAL_URL;
const percySnapshot = require('@percy/playwright');

const snapshotScope = '.l-shell__pane-main .l-pane__contents';

test.describe('Visual - Display Layout', () => {
  test('Edit Marquee', async ({ page, theme, openmctConfig }) => {
    const {
      parentObjectView,
      child1ObjectView
    } = await setupBaseline(page, theme, openmctConfig);

    await child1ObjectView.click();
  });
});

async function setupBaseline(page, theme, openmctConfig) {
  const { myItemsFolderName } = openmctConfig;

  // Load Open MCT visual test baseline
  await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  // Open Tree
  await page.getByRole('button', { name: 'Browse' }).click();

  const treePane = page.getByRole('tree', {
    name: 'Main Tree'
  });

  const objectView = page.locator('.c-object-view');
  const parentObjectView = objectView.first();
  const child1ObjectView = parentObjectView.locator(objectView).first();
  const child1ObjectViewObject = child1ObjectView.locator('.c-telemetry-view');
  const editButton = page.locator('[title="Edit"]');
  const saveButton = page.locator('button[title="Save"]');
  const confirmSaveAndFinishEditingButton = page.locator('text=Save and Finish Editing');
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

  // Expand My Items folder
  await expandTreePaneItemByName(page, myItemsFolderName);

  // Add swg1 to child1Layout
  await page.goto(child1Layout.url);
  await editButton.click();
  await swg1TreeItem.dragTo(parentObjectView, { targetPosition: { x: 0, y: 0 } });
  await saveButton.click();
  await confirmSaveAndFinishEditingButton.click();

  // Add swg1 to child1Layout
  await page.goto(child2Layout.url);
  await editButton.click();
  await swg2TreeItem.dragTo(parentObjectView, { targetPosition: { x: 0, y: 0 } });
  await saveButton.click();
  await confirmSaveAndFinishEditingButton.click();

  // Add child1Layout and child2Layout to parentLayout
  await page.goto(parentLayout.url);
  await editButton.click();
  await child1LayoutTreeItem.dragTo(parentObjectView, { targetPosition: { x: 350, y: 0 } });
  await child2LayoutTreeItem.dragTo(parentObjectView, { targetPosition: { x: 0, y: 0 } });

  return {
    parentObjectView,
    child1ObjectView,
    child1ObjectViewObject
  };
}
