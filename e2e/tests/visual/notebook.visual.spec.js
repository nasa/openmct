/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
const { createDomainObjectWithDefaults } = require('../../appActions');

// Drop Overlay Plot into Notebook
// percysnapshot()

test.describe('Visual - Notebook', () => {
    test.only('Accepts dropped objects as embeds', async ({ page, theme, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;
        await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });

        // Create Notebook
        const notebook = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Embed Test Notebook"
        });
        // Create Overlay Plot
        await createDomainObjectWithDefaults(page, {
            type: 'Overlay Plot',
            name: "Dropped Overlay Plot"
        });

        await expandTreePaneItemByName(page, myItemsFolderName);

        await page.goto(notebook.url);
        await page.dragAndDrop('role=treeitem[name=/Dropped Overlay Plot/]', '.c-notebook__drag-area');

        await percySnapshot(page, `Notebook w/ dropped embed (theme: ${theme})`);

    });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function expandTreePaneItemByName(page, name) {
    const treePane = page.locator('#tree-pane');
    const treeItem = treePane.locator(`role=treeitem[expanded=false][name=/${name}/]`);
    const expandTriangle = treeItem.locator('.c-disclosure-triangle');
    await expandTriangle.click();
}
