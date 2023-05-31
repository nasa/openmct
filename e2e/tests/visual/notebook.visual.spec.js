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
const percySnapshot = require('@percy/playwright');
const { expandTreePaneItemByName, createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Visual - Notebook', () => {
  test('Accepts dropped objects as embeds @unstable', async ({ page, theme, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;
    await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });

    // Create Notebook
    const notebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Embed Test Notebook'
    });
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Dropped Overlay Plot'
    });

    await expandTreePaneItemByName(page, myItemsFolderName);

    await page.goto(notebook.url);
    await page.dragAndDrop('role=treeitem[name=/Dropped Overlay Plot/]', '.c-notebook__drag-area');

    await percySnapshot(page, `Notebook w/ dropped embed (theme: ${theme})`);
  });
});
