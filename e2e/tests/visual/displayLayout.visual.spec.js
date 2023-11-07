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
const {
  expandTreePaneItemByName,
  createDomainObjectWithDefaults
} = require('../../appActions');
const percySnapshot = require('@percy/playwright');
const VISUAL_URL = require('../../constants').VISUAL_URL;

const snapshotScope = '.l-shell__pane-main .l-pane__contents';
// const treePane = "[role=tree][aria-label='Main Tree']";

test.describe('Visual - Display Layout', () => {
  test('Edit Marquee', async ({ page, theme, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });

    //Open Tree
    await page.getByRole('button', { name: 'Browse' }).click();

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

    await expandTreePaneItemByName(page, myItemsFolderName);

    await page.goto(child1Layout.url);
    await page.dragAndDrop(`role=treeitem[name=/${swg1.name}/]`, '.c-object-view');
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    await page.goto(child2Layout.url);
    await page.dragAndDrop(`role=treeitem[name=/${swg2.name}/]`, '.c-object-view');
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    await page.goto(parentLayout.url);
    await page.locator('[title="Edit"]').click();
  });
});
