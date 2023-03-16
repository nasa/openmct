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
const path = require('path');

const CUSTOM_NAME = 'CUSTOM_NAME';

test.describe('Visual - Restricted Notebook', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
    });
    test.use({
        clockOptions: {
            shouldAdvanceTime: false //Don't advance the clock
        }
    });

    test('Restricted Notebook is visually correct @addInit @unstable', async ({ page, theme }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, '../../helper', './addInitRestrictedNotebook.js') });
        //Go to baseURL and hide tree
        await page.goto('./', { waitUntil: 'networkidle' });

        await createDomainObjectWithDefaults(page, { type: CUSTOM_NAME });

        // Take a snapshot of the newly created CUSTOM_NAME notebook
        await percySnapshot(page, `Restricted Notebook with CUSTOM_NAME (theme: '${theme}')`);
    });
});

test.describe('Visual - Notebook', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
    });
    test('Accepts dropped objects as embeds @unstable', async ({ page, theme, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

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
    test("Blur 'Add tag' on Notebook", async ({ page, theme }) => {
        await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });
        await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Add Tag Test Notebook"
        });
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        const entryLocator = `[aria-label="Notebook Entry Input"] >> nth = 0`;
        await page.locator(entryLocator).click();
        await page.locator(entryLocator).fill(`Entry 0`);
        await page.locator(entryLocator).press('Enter');

        // Click on Annotations tab
        await page.locator('.c-inspector__tab', { hasText: "Annotations" }).click();

        // Take snapshot of the notebook with the Annotations tab opened
        await percySnapshot(page, `Notebook Annotation (theme: '${theme}')`);

        // Click on the "Add Tag" button
        await page.locator('button:has-text("Add Tag")').click();

        // Take snapshot of the notebook with the AutoComplete field visible
        await percySnapshot(page, `Notebook Add Tag (theme: '${theme}')`);

        // Click inside the AutoComplete field
        await page.locator('[placeholder="Type to select tag"]').click();

        // Click on the "Tags" header (simulating a click outside the autocomplete field)
        await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

        // Take snapshot of the notebook with the AutoComplete field hidden and with the "Add Tag" button visible
        await percySnapshot(page, `Notebook Annotation de-select blur (theme: '${theme}')`);
    });
});
