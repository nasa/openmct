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

/*
This test suite is dedicated to tests which verify form functionality.
*/

const { test, expect } = require('@playwright/test');

test.describe('Tagging in Notebooks', () => {
    async function createNotebookAndEntry(page) {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click button:has-text("Create")
        await page.locator('button:has-text("Create")').click();
        // Click li:has-text("Notebook")
        await page.locator('li:has-text("Notebook")').click();
        // Click button:has-text("OK")
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/b8a33dd9-34c1-4981-82c7-0b5f45301fde?tc.mode=fixed&tc.startBound=1655456181296&tc.endBound=1655457981296&tc.timeSystem=utc&view=notebook-vue&pageId=ede28c83-206a-45cb-bcb0-cf5ba889af51&sectionId=4f75da12-0fa1-45aa-9174-1f21cb710fc0' }*/),
            page.locator('button:has-text("OK")').click()
        ]);

        // Click text=To start a new entry, click here or drag and drop any object
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
    }

    async function createNotebookEntryAndTags(page) {
        await createNotebookAndEntry(page);
        // Click text=To start a new entry, click here or drag and drop any object
        await page.locator('button:has-text("Add Tag")').click();

        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();
        // Click text=Driving
        await page.locator('text=Driving').click();

        // Click button:has-text("Add Tag")
        await page.locator('button:has-text("Add Tag")').click();
        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();
        // Click text=Science
        await page.locator('text=Science').click();
    }

    test('Can load tags', async ({ page }) => {
        await createNotebookAndEntry(page);
        // Click text=To start a new entry, click here or drag and drop any object
        await page.locator('button:has-text("Add Tag")').click();

        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();

        await expect(page.locator('.c-input--autocomplete__options')).toContainText("Science");
        await expect(page.locator('.c-input--autocomplete__options')).toContainText("Drilling");
        await expect(page.locator('.c-input--autocomplete__options')).toContainText("Driving");
    });
    test('Can add tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);

        await expect(page.locator('.c-notebook__entry')).toContainText("Science");
        await expect(page.locator('.c-notebook__entry')).toContainText("Driving");

        // Click button:has-text("Add Tag")
        await page.locator('button:has-text("Add Tag")').click();
        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();

        await expect(page.locator('.c-input--autocomplete__options')).not.toContainText("Science");
        await expect(page.locator('.c-input--autocomplete__options')).not.toContainText("Driving");
        await expect(page.locator('.c-input--autocomplete__options')).toContainText("Drilling");
    });
    test('Can search for tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('.c-gsearch-result')).toContainText("Science");
        await expect(page.locator('.c-gsearch-result')).toContainText("Driving");
    });

    test('Can delete tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        await page.locator('.c-notebook__entries').click();
        // Delete Driving
        await page.locator('text=Science Driving Add Tag >> button').nth(1).click();

        await expect(page.locator('.c-notebook__entry')).toContainText("Science");
        await expect(page.locator('.c-notebook__entry')).not.toContainText("Driving");

        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('.c-gsearch-result')).not.toContainText("Driving");
    });
    test('Tags persist across reload', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        //Go to baseURL
        await page.reload();
        await expect(page.locator('.c-notebook__entry')).toContainText("Science");
        await expect(page.locator('.c-notebook__entry')).toContainText("Driving");
    });
});
