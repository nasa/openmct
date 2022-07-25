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

const { test, expect } = require("@playwright/test");

test.describe("Search Tests", () => {
    const searchResultSelector = '.c-gsearch-result__title';

    test('Validate empty search result [no match search]', async ({ page }) => {
        // Go to baseURL
        await page.goto("/", { waitUntil: "networkidle" });

        // Invalid search for objects
        await page.type("input[type=search]", 'not found');

        // Wait for search to complete
        await waitForSearchCompletion(page);

        // Get the search results
        const searchResults = await page.locator(searchResultSelector);

        // Verify that no results are found
        expect(await searchResults.count()).toBe(0);
    });

    test('Validate single object in search result [full search]', async ({ page }) => {
        //Go to baseURL
        await page.goto("/", { waitUntil: "networkidle" });

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

    test("Validate multiple objects in search results [partial search]", async ({ page }) => {
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
