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
/**
 * This test suite is dedicated to tests which verify search functionalities.
 */

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const { v4: uuid } = require('uuid');

test.describe('Grand Search', () => {
    test('Can search for objects, and subsequent search dropdown behaves properly', async ({ page, openmctConfig }) => {
        const inspectorElementsTab = page.locator('[aria-role="tab"] >> text=Elements');
        const { myItemsFolderName } = openmctConfig;

        const createdObjects = await createObjectsForSearch(page);

        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Cl');
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toContainText(`Clock A ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=1')).toContainText(`Clock B ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=2')).toContainText(`Clock C ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=3')).toContainText(`Clock D ${myItemsFolderName} Red Folder Blue Folder`);
        // Click the Elements pool to dismiss the search menu
        await inspectorElementsTab.click();
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toBeHidden();

        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();
        await page.locator('[aria-label="Clock A clock result"] >> text=Clock A').click();
        await expect(page.locator('.js-preview-window')).toBeVisible();

        // Click [aria-label="Close"]
        await page.locator('[aria-label="Close"]').click();
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toBeVisible();
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toContainText(`Clock A ${myItemsFolderName} Red Folder Blue Folder`);

        // Click [aria-label="OpenMCT Search"] a >> nth=0
        await page.locator('[aria-label="OpenMCT Search"] a').first().click();
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toBeHidden();

        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('foo');
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toBeHidden();

        // Click text=Snapshot Save and Finish Editing Save and Continue Editing >> button >> nth=1
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        // Click text=Save and Finish Editing
        await page.locator('text=Save and Finish Editing').click();
        // Click [aria-label="OpenMCT Search"] [aria-label="Search Input"]
        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();
        // Fill [aria-label="OpenMCT Search"] [aria-label="Search Input"]
        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').fill('Cl');
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Clock A').click()
        ]);
        await expect(page.locator('.is-object-type-clock')).toBeVisible();

        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').fill('Disp');
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toContainText(createdObjects.displayLayout.name);
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).not.toContainText('Folder');

        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Clock C');
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toContainText(`Clock C ${myItemsFolderName} Red Folder Blue Folder`);

        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Cloc');
        await expect(page.locator('[aria-label="Search Result"] >> nth=0')).toContainText(`Clock A ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=1')).toContainText(`Clock B ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=2')).toContainText(`Clock C ${myItemsFolderName} Red Folder Blue Folder`);
        await expect(page.locator('[aria-label="Search Result"] >> nth=3')).toContainText(`Clock D ${myItemsFolderName} Red Folder Blue Folder`);
    });
});

test.describe("Search Tests @unstable", () => {
    const searchResultSelector = '.c-gsearch-result__title';

    test('Validate empty search result', async ({ page }) => {
        // Go to baseURL
        await page.goto("./", { waitUntil: "networkidle" });

        // Invalid search for objects
        await page.type("input[type=search]", 'not found');

        // Wait for search to complete
        await waitForSearchCompletion(page);

        // Get the search results
        const searchResults = await page.locator(searchResultSelector);

        // Verify that no results are found
        expect(await searchResults.count()).toBe(0);

        // Verify proper message appears
        await expect(page.locator('text=No results found')).toBeVisible();
    });

    test('Validate single object in search result @couchdb', async ({ page }) => {
        //Go to baseURL
        await page.goto("./", { waitUntil: "networkidle" });

        // Create a folder object
        const folderName = uuid();
        await createDomainObjectWithDefaults(page, {
            type: 'folder',
            name: folderName
        });

        // Full search for object
        await page.type("input[type=search]", folderName);

        // Wait for search to complete
        await waitForSearchCompletion(page);

        // Get the search results
        const searchResults = page.locator(searchResultSelector);

        // Verify that one result is found
        expect(await searchResults.count()).toBe(1);
        await expect(searchResults).toHaveText(folderName);
    });

    test("Validate multiple objects in search results return partial matches", async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/4667'
        });

        // Go to baseURL
        await page.goto("/", { waitUntil: "networkidle" });

        // Create folder objects
        const folderName = "e928a26e-e924-4ea0";
        const folderName2 = "e928a26e-e924-4001";

        await createFolderObject(page, folderName);
        await createFolderObject(page, folderName2);

        // Partial search for objects
        await page.type("input[type=search]", 'e928a26e');

        // Wait for search to finish
        await waitForSearchCompletion(page);

        // Get the search results
        const searchResults = await page.locator(searchResultSelector);

        // Verify that the search result/s correctly match the search query
        expect(await searchResults.count()).toBe(2);
        await expect(await searchResults.first()).toHaveText(folderName);
        await expect(await searchResults.last()).toHaveText(folderName2);
    });
});

async function createFolderObject(page, folderName) {
    // Open Create menu
    await page.locator('button:has-text("Create")').click();

    // Select Folder object
    await page.locator('text=Folder').nth(1).click();

    // Click folder title to enter edit mode
    await page.locator('text=Properties Title Notes >> input[type="text"]').click();

    // Enter folder name
    await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folderName);

    // Create folder object
    await page.locator('button:has-text("OK")').click();
}

async function waitForSearchCompletion(page) {
    // Wait loading spinner to disappear
    await page.waitForSelector('.c-tree-and-search__loading', { state: 'detached' });
}

/**
  * Creates some domain objects for searching
  * @param {import('@playwright/test').Page} page
  */
async function createObjectsForSearch(page) {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    const redFolder = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Red Folder'
    });

    const blueFolder = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Blue Folder',
        parent: redFolder.uuid
    });

    const clockA = await createDomainObjectWithDefaults(page, {
        type: 'Clock',
        name: 'Clock A',
        parent: blueFolder.uuid
    });
    const clockB = await createDomainObjectWithDefaults(page, {
        type: 'Clock',
        name: 'Clock B',
        parent: blueFolder.uuid
    });
    const clockC = await createDomainObjectWithDefaults(page, {
        type: 'Clock',
        name: 'Clock C',
        parent: blueFolder.uuid
    });
    const clockD = await createDomainObjectWithDefaults(page, {
        type: 'Clock',
        name: 'Clock D',
        parent: blueFolder.uuid
    });

    const displayLayout = await createDomainObjectWithDefaults(page, {
        type: 'Display Layout'
    });

    // Go back into edit mode for the display layout
    await page.locator('button[title="Edit"]').click();

    return {
        redFolder,
        blueFolder,
        clockA,
        clockB,
        clockC,
        clockD,
        displayLayout
    };
}
