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
This test suite is dedicated to tests which verify search functionality.
*/

const { expect } = require('@playwright/test');
const { test } = require('../../../../fixtures');

/**
  * Creates a notebook object and adds an entry.
  * @param {import('@playwright/test').Page} page
  */
async function createClockAndDisplayLayout(page) {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

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
        page.locator('a:has-text("My Items") >> nth=0').click()
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

test.describe('Grand Search', () => {
    test('Can search for objects, and subsequent search dropdown behaves properly', async ({ page }) => {
        await createClockAndDisplayLayout(page);

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
