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

const { test } = require('../../../pluginFixtures.js');
const { createDomainObjectWithDefaults } = require('../../../appActions.js');

const percySnapshot = require('@percy/playwright');

test.describe('Visual - Tree Pane', () => {
  test('Tree pane in various states @unstable', async ({ page, theme, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;
    await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });

    const foo = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Foo Folder'
    });

    const bar = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Bar Folder',
      parent: foo.uuid
    });

    const baz = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Baz Folder',
      parent: bar.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'A Clock'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'Z Clock'
    });

    const treePane = "[role=tree][aria-label='Main Tree']";

    await percySnapshot(page, `Tree Pane w/ collapsed tree (theme: ${theme})`, {
      scope: treePane
    });

    await expandTreePaneItemByName(page, myItemsFolderName);

    await page.goto(foo.url);
    await page.dragAndDrop('role=treeitem[name=/A Clock/]', '.c-object-view');
    await page.dragAndDrop('role=treeitem[name=/Z Clock/]', '.c-object-view');
    await page.goto(bar.url);
    await page.dragAndDrop('role=treeitem[name=/A Clock/]', '.c-object-view');
    await page.dragAndDrop('role=treeitem[name=/Z Clock/]', '.c-object-view');
    await page.goto(baz.url);
    await page.dragAndDrop('role=treeitem[name=/A Clock/]', '.c-object-view');
    await page.dragAndDrop('role=treeitem[name=/Z Clock/]', '.c-object-view');

    await percySnapshot(page, `Tree Pane w/ single level expanded (theme: ${theme})`, {
      scope: treePane
    });

    await expandTreePaneItemByName(page, foo.name);
    await expandTreePaneItemByName(page, bar.name);
    await expandTreePaneItemByName(page, baz.name);

    await percySnapshot(page, `Tree Pane w/ multiple levels expanded (theme: ${theme})`, {
      scope: treePane
    });
  });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function expandTreePaneItemByName(page, name) {
  const treePane = page.getByTestId('tree-pane');
  const treeItem = treePane.locator(`role=treeitem[expanded=false][name=/${name}/]`);
  const expandTriangle = treeItem.locator('.c-disclosure-triangle');
  await expandTriangle.click();
}
