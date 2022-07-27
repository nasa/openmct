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

test.describe('Grand Search', () => {
    test('Can search for objects, and subsequent search dropdown behaves properly', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        await createClockAndDisplayLayout(page, myItemsFolderName);

        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Cl');
        await expect(page.locator('[aria-label="Search Result"]')).toContainText('Clock');
        // Click text=Elements >> nth=0
        await page.locator('text=Elements').first().click();
        await expect(page.locator('[aria-label="Search Result"]')).not.toBeVisible();

        // Click [aria-label="OpenMCT Search"] [aria-label="Search Input"]
        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();
        // Click [aria-label="Unnamed Clock clock result"] >> text=Unnamed Clock
        await page.locator('[aria-label="Unnamed Clock clock result"] >> text=Unnamed Clock').click();
        await expect(page.locator('.js-preview-window')).toBeVisible();

        // Click [aria-label="Close"]
        await page.locator('[aria-label="Close"]').click();
        await expect(page.locator('[aria-label="Search Result"]')).toBeVisible();
        await expect(page.locator('[aria-label="Search Result"]')).toContainText('Cloc');

        // Click [aria-label="OpenMCT Search"] a >> nth=0
        await page.locator('[aria-label="OpenMCT Search"] a').first().click();
        await expect(page.locator('[aria-label="Search Result"]')).not.toBeVisible();

        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('foo');
        await expect(page.locator('[aria-label="Search Result"]')).not.toBeVisible();

        // Click text=Snapshot Save and Finish Editing Save and Continue Editing >> button >> nth=1
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        // Click text=Save and Finish Editing
        await page.locator('text=Save and Finish Editing').click();
        // Click [aria-label="OpenMCT Search"] [aria-label="Search Input"]
        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();
        // Fill [aria-label="OpenMCT Search"] [aria-label="Search Input"]
        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').fill('Cl');
        // Click text=Unnamed Clock
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Clock').click()
        ]);
        await expect(page.locator('.is-object-type-clock')).toBeVisible();
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
    });

    test('Validate single object in search result', async ({ page }) => {
        //Go to baseURL
        await page.goto("./", { waitUntil: "networkidle" });

        // Create a folder object
        const folderName = 'testFolder';
        await createFolderObject(page, folderName);

        // Full search for object
        await page.type("input[type=search]", folderName);

        // Wait for search to complete
        await waitForSearchCompletion(page);

        // Get the search results
        const searchResults = await page.locator(searchResultSelector);

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
    await page.locator('text=OK').click();
}

async function waitForSearchCompletion(page) {
    // Wait loading spinner to disappear
    await page.waitForSelector('.c-tree-and-search__loading', { state: 'detached' });
}

/**
  * Creates a notebook object and adds an entry.
  * @param {import('@playwright/test').Page} page
  * @param {string} myItemsFolderName
  */
async function createClockAndDisplayLayout(page, myItemsFolderName) {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    // Click button:has-text("Create")
    await page.locator('button:has-text("Create")').click();
    // Click li:has-text("Notebook")
    await page.locator('li:has-text("Clock")').click();
    // Click button:has-text("OK")
    await Promise.all([
        page.waitForNavigation(),
        page.locator('button:has-text("OK")').click()
    ]);

    // Click a:has-text("My Items")
    await Promise.all([
        page.waitForNavigation(),
        page.locator(`a:has-text("${myItemsFolderName}") >> nth=0`).click()
    ]);
    // Click button:has-text("Create")
    await page.locator('button:has-text("Create")').click();
    // Click li:has-text("Notebook")
    await page.locator('li:has-text("Display Layout")').click();
    // Click button:has-text("OK")
    await Promise.all([
        page.waitForNavigation(),
        page.locator('button:has-text("OK")').click()
    ]);
}
