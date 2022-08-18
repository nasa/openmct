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

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

/**
  * Creates a notebook object and adds an entry.
  * @param {import('@playwright/test').Page} - page to load
  * @param {number} [iterations = 1] - the number of entries to create
  */
async function createNotebookAndEntry(page, iterations = 1) {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    createDomainObjectWithDefaults(page, { type: 'Notebook' });

    for (let iteration = 0; iteration < iterations; iteration++) {
        // Click text=To start a new entry, click here or drag and drop any object
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        const entryLocator = `[aria-label="Notebook Entry Input"] >> nth = ${iteration}`;
        await page.locator(entryLocator).click();
        await page.locator(entryLocator).fill(`Entry ${iteration}`);
    }
}

/**
  * Creates a notebook object, adds an entry, and adds a tag.
  * @param {import('@playwright/test').Page} page
  * @param {number} [iterations = 1] - the number of entries (and tags) to create
  */
async function createNotebookEntryAndTags(page, iterations = 1) {
    await createNotebookAndEntry(page, iterations);

    for (let iteration = 0; iteration < iterations; iteration++) {
        // Hover and click "Add Tag" button
        // Hover is needed here to "slow down" the actions while running in headless mode
        await page.hover(`button:has-text("Add Tag") >> nth = ${iteration}`);
        await page.locator(`button:has-text("Add Tag") >> nth = ${iteration}`).click();

        // Click inside the tag search input
        await page.locator('[placeholder="Type to select tag"]').click();
        // Select the "Driving" tag
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();

        // Hover and click "Add Tag" button
        // Hover is needed here to "slow down" the actions while running in headless mode
        await page.hover(`button:has-text("Add Tag") >> nth = ${iteration}`);
        await page.locator(`button:has-text("Add Tag") >> nth = ${iteration}`).click();
        // Click inside the tag search input
        await page.locator('[placeholder="Type to select tag"]').click();
        // Select the "Science" tag
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
    }
}

test.describe('Tagging in Notebooks @addInit', () => {
    test('Can load tags', async ({ page }) => {

        await createNotebookAndEntry(page);
        // Click text=To start a new entry, click here or drag and drop any object
        await page.locator('button:has-text("Add Tag")').click();

        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();

        await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText("Drilling");
        await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText("Driving");
    });
    test('Can add tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);

        await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText("Driving");

        // Click button:has-text("Add Tag")
        await page.locator('button:has-text("Add Tag")').click();
        // Click [placeholder="Type to select tag"]
        await page.locator('[placeholder="Type to select tag"]').click();

        await expect(page.locator('[aria-label="Autocomplete Options"]')).not.toContainText("Science");
        await expect(page.locator('[aria-label="Autocomplete Options"]')).not.toContainText("Driving");
        await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText("Drilling");
    });
    test('Can search for tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('[aria-label="Search Result"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Search Result"]')).toContainText("Driving");

        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Sc');
        await expect(page.locator('[aria-label="Search Result"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Search Result"]')).toContainText("Driving");

        // Click [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Xq');
        await expect(page.locator('[aria-label="Search Result"]')).not.toBeVisible();
        await expect(page.locator('[aria-label="Search Result"]')).not.toBeVisible();
    });

    test('Can delete tags', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        await page.locator('[aria-label="Notebook Entries"]').click();
        // Delete Driving
        await page.hover('.c-tag__label:has-text("Driving")');
        await page.locator('.c-tag__label:has-text("Driving") ~ .c-completed-tag-deletion').click();

        await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Notebook Entry"]')).not.toContainText("Driving");

        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('[aria-label="Search Result"]')).not.toContainText("Driving");
    });

    test('Can delete objects with tags and neither return in search', async ({ page }) => {
        await createNotebookEntryAndTags(page);
        // Delete Notebook
        await page.locator('button[title="More options"]').click();
        await page.locator('li[title="Remove this object from its containing object."]').click();
        await page.locator('button:has-text("OK")').click();
        await page.goto('./', { waitUntil: 'networkidle' });

        // Fill [aria-label="OpenMCT Search"] input[type="search"]
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Unnamed');
        await expect(page.locator('text=No matching results.')).toBeVisible();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sci');
        await expect(page.locator('text=No matching results.')).toBeVisible();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('dri');
        await expect(page.locator('text=No matching results.')).toBeVisible();
    });
    test('Tags persist across reload', async ({ page }) => {
        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        await createDomainObjectWithDefaults(page, { type: 'Clock' });

        const ITERATIONS = 4;
        await createNotebookEntryAndTags(page, ITERATIONS);

        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            const entryLocator = `[aria-label="Notebook Entry"] >> nth = ${iteration}`;
            await expect(page.locator(entryLocator)).toContainText("Science");
            await expect(page.locator(entryLocator)).toContainText("Driving");
        }

        await Promise.all([
            page.waitForNavigation(),
            page.goto('./#/browse/mine?hideTree=false'),
            page.click('.c-disclosure-triangle')
        ]);
        // Click Unnamed Clock
        await page.click('text="Unnamed Clock"');

        // Click Unnamed Notebook
        await page.click('text="Unnamed Notebook"');

        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            const entryLocator = `[aria-label="Notebook Entry"] >> nth = ${iteration}`;
            await expect(page.locator(entryLocator)).toContainText("Science");
            await expect(page.locator(entryLocator)).toContainText("Driving");
        }

        //Reload Page
        await Promise.all([
            page.reload(),
            page.waitForLoadState('networkidle')
        ]);

        // Click Unnamed Notebook
        await page.click('text="Unnamed Notebook"');

        for (let iteration = 0; iteration < ITERATIONS; iteration++) {
            const entryLocator = `[aria-label="Notebook Entry"] >> nth = ${iteration}`;
            await expect(page.locator(entryLocator)).toContainText("Science");
            await expect(page.locator(entryLocator)).toContainText("Driving");
        }

    });
});
