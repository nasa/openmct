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

const { test, expect } = require('../../pluginFixtures.js');
const { createDomainObjectWithDefaults } = require('../../appActions.js');

test.describe('Recent Objects', () => {
    let recentObjectsList;
    let clock;
    let folderA;
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        // Set Recent Objects List locator for subsequent tests
        recentObjectsList = page.getByRole('list', {
            name: 'Recent Objects'
        });

        // Create a folder and nest a Clock within it
        folderA = await createDomainObjectWithDefaults(page, {
            type: 'Folder'
        });
        clock = await createDomainObjectWithDefaults(page, {
            type: 'Clock',
            parent: folderA.uuid
        });

        // Drag the Recent Objects panel up a bit
        await page.locator('div:nth-child(2) > .l-pane__handle').hover();
        await page.mouse.down();
        await page.mouse.move(0, 100);
        await page.mouse.up();
    });
    test('Recent Objects CRUD operations', async ({ page }) => {
        // Verify that both created objects appear in the list and are in the correct order
        expect(recentObjectsList.getByRole('listitem', { name: clock.name })).toBeTruthy();
        expect(recentObjectsList.getByRole('listitem', { name: folderA.name })).toBeTruthy();
        expect(recentObjectsList.getByRole('listitem', { name: clock.name }).locator('a').getByText(folderA.name)).toBeTruthy();
        expect(recentObjectsList.getByRole('listitem').nth(0).getByText(clock.name)).toBeTruthy();
        expect(recentObjectsList.getByRole('listitem', { name: clock.name }).locator('a').getByText(folderA.name)).toBeTruthy();
        expect(recentObjectsList.getByRole('listitem').nth(1).getByText(folderA.name)).toBeTruthy();

        // Navigate to the folder by clicking on the main object name in the recent objects list item
        await page.getByRole('listitem', { name: folderA.name }).getByText(folderA.name).click();
        await page.waitForURL(`**/${folderA.uuid}?*`);
        expect(recentObjectsList.getByRole('listitem').nth(0).getByText(folderA.name)).toBeTruthy();

        // Rename
        folderA.name = `${folderA.name}-NEW!`;
        await page.locator('.l-browse-bar__object-name').fill("");
        await page.locator('.l-browse-bar__object-name').fill(folderA.name);
        await page.keyboard.press('Enter');

        // Verify rename has been applied in recent objects list item and objects paths
        expect(await page.getByRole('navigation', {
            name: `${clock.name} Breadcrumb`
        }).locator('a').filter({
            hasText: folderA.name
        }).count()).toBeGreaterThan(0);
        expect(recentObjectsList.getByRole('listitem', { name: folderA.name })).toBeTruthy();

        // Delete
        await page.click('button[title="Show selected item in tree"]');
        // Delete the folder via the left tree pane treeitem context menu
        await page.getByRole('treeitem', { name: new RegExp(folderA.name) }).locator('a').click({
            button: 'right'
        });
        await page.getByRole('menuitem', { name: /Remove/ }).click();
        await page.getByRole('button', { name: 'OK' }).click();

        // Verify that the folder and clock are no longer in the recent objects list
        await expect(recentObjectsList.getByRole('listitem', { name: folderA.name })).toBeHidden();
        await expect(recentObjectsList.getByRole('listitem', { name: clock.name })).toBeHidden();
    });
    test("Clicking on an object in the path of a recent object navigates to the object", async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/6151'
        });
        await page.goto('./#/browse/mine');

        // Navigate to the folder by clicking on its entry in the Clock's breadcrumb
        const waitForFolderNavigation = page.waitForURL(`**/${folderA.uuid}?*`);
        await page.getByRole('navigation', {
            name: `${clock.name} Breadcrumb`
        }).locator('a').filter({
            hasText: folderA.name
        }).click();

        // Verify that the hash URL updates correctly
        await waitForFolderNavigation;
        // eslint-disable-next-line no-useless-escape
        expect(page.url()).toMatch(new RegExp(`.*${folderA.uuid}\?.*`));

        // Navigate to My Items by clicking on its entry in the Clock's breadcrumb
        const waitForMyItemsNavigation = page.waitForURL(`**/mine?*`);
        await page.getByRole('navigation', {
            name: `${clock.name} Breadcrumb`
        }).locator('a').filter({
            hasText: myItemsFolderName
        }).click();

        // Verify that the hash URL updates correctly
        await waitForMyItemsNavigation;
        // eslint-disable-next-line no-useless-escape
        expect(page.url()).toMatch(new RegExp(`.*mine\?.*`));
    });
    test.fixme("Clicking on the 'target button' scrolls the object into view in the tree and highlights it", async ({ page }) => {
    });
    test.fixme("Tests for context menu actions from recent objects", async ({ page }) => {
    });
});
