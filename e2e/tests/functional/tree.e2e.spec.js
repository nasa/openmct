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

const { test, expect } = require('../../pluginFixtures.js');
const { createDomainObjectWithDefaults, openObjectTreeContextMenu } = require('../../appActions.js');

test.describe('Tree operations', () => {
    test('Renaming an object reorders the tree @unstable', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;
        await page.goto('./', { waitUntil: 'networkidle' });

        const fooFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Foo'
        });

        const barFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Bar'
        });

        const bazFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Baz'
        });

        const clock1 = await createDomainObjectWithDefaults(page, {
            type: 'Clock',
            name: 'aaa'
        });

        const clock2 = await createDomainObjectWithDefaults(page, {
            type: 'Clock',
            name: 'www'
        });

        await test.step("Reorders objects with the same tree depth", async () => {
            // Expand the root folder
            await expandTreeItem(page, myItemsFolderName);
            await getAndAssertTreeItems(page, ['aaa', 'Bar', 'Baz', 'Foo', 'www']);
            await renameObjectFromContextMenu(page, myItemsFolderName, clock1.name, 'zzz');
            await getAndAssertTreeItems(page, ['Bar', 'Baz', 'Foo', 'www', 'zzz']);
        });
    });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {Array<string>} expected
 */
async function getAndAssertTreeItems(page, expected) {
    const treeItems = page.locator('[role="treeitem"]');
    const allTexts = await treeItems.allInnerTexts();
    // Get rid of root folder ('My Items') as its position will not change
    allTexts.shift();
    expect(allTexts).toEqual(expected);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 * @param {string} currentName
 * @param {string} newName
 */
async function renameObjectFromContextMenu(page, myItemsFolderName, currentName, newName) {
    await openObjectTreeContextMenu(page, myItemsFolderName, currentName);
    await page.click('li:text("Edit Properties")');
    const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
    await nameInput.fill("");
    await nameInput.fill(newName);
    await page.click('[aria-label="Save"]');
}

async function expandTreeItem(page, name) {
    const treeItem = page.locator(`role=treeitem[expanded=false][name*='${name}']`);
    const expandTriangle = treeItem.locator('.c-disclosure-triangle');
    await expandTriangle.click();
}
