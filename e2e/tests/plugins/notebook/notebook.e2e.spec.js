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

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');
const path = require('path');

const TEST_TEXT = 'Testing text for entries.';
const TEST_TEXT_NAME = 'Test Page';
const CUSTOM_NAME = 'CUSTOM_NAME';
const COMMIT_BUTTON_TEXT = 'button:has-text("Commit Entries")';
const SINE_WAVE_GENERATOR = 'text=Unnamed Sine Wave Generator';
const DROP_AREA = '.c-notebook__drag-area';

async function enterTextEntry(page) {
    // Click .c-notebook__drag-area
    await page.locator(DROP_AREA).click();

    // enter text
    await page.locator('div.c-ne__text').click();
    await page.locator('div.c-ne__text').fill(TEST_TEXT);
    await page.locator('div.c-ne__text').press('Enter');

    return;
}

async function dragAndDropEmbed(page) {
    // Click button:has-text("Create")
    await page.locator('button:has-text("Create")').click();
    // Click li:has-text("Sine Wave Generator")
    await page.locator('li:has-text("Sine Wave Generator")').click();
    // Click form[name="mctForm"] >> text=My Items
    await page.locator('form[name="mctForm"] >> text=My Items').click();
    // Click text=OK
    await page.locator('text=OK').click();
    // Click text=Open MCT My Items >> span >> nth=3
    await page.locator('text=Open MCT My Items >> span').nth(3).click();
    // Click text=Unnamed CUSTOM_NAME
    await Promise.all([
        page.waitForNavigation(),
        page.locator('text=Unnamed CUSTOM_NAME').click()
    ]);

    await page.dragAndDrop(SINE_WAVE_GENERATOR, DROP_AREA);

    return;
}

test.describe('Notebook Operations', () => {

    test.beforeEach(async ({ page }) => {

        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Notebook');
        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK')
        ]);
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText(`Unnamed Notebook`);
    });

    test.only('Can search for page, section, and entry', async ({ page }) => {
        await page.pause();
    });

    test('Can add page, rename, add entry, delete unlocked pages', async ({ page }) => {
    // Click text=Page Add >> button
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Page Add >> button').click()
        ]);
        // Click text=Unnamed Page >> nth=1
        await page.locator('text=Unnamed Page').nth(1).click();
        // Press a with modifiers
        await page.locator('text=Unnamed Page').nth(1).fill(TEST_TEXT_NAME);

        // expect to be able to rename unlocked pages
        const newPageElement = page.locator(`text=${TEST_TEXT_NAME}`);
        const newPageCount = await newPageElement.count();
        await newPageElement.press('Enter'); // exit contenteditable state
        await expect.soft(newPageCount).toEqual(1);

        // enter test text
        await enterTextEntry(page);

        // expect new page to be lockable
        const commitButton = page.locator(COMMIT_BUTTON_TEXT);
        expect.soft(await commitButton.count()).toEqual(1);

        // Click text=Unnamed PageTest Page >> button
        await page.locator('text=Unnamed PageTest Page >> button').click();
        // Click text=Delete Page
        await page.locator('text=Delete Page').click();
        // Click text=Ok
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Ok').click()
        ]);

        // deleted page, should no longer exist
        const deletedPageElement = page.locator(`text=${TEST_TEXT_NAME}`);
        expect.soft(await deletedPageElement.count()).toEqual(0);

    });

    test.describe('With a page with embeds', () => {

        test.beforeEach(async ({ page }) => {
            await dragAndDropEmbed(page);
        });

        test('Allows embeds to be deleted', async ({ page }) => {

            // Click .c-ne__embed__name .c-popup-menu-button
            await page.locator('.c-ne__embed__name .c-popup-menu-button').click(); // embed popup menu

            const embedMenu = page.locator('body >> .c-menu');
            await expect.soft(embedMenu).toContainText('Remove This Embed');
        });

    });
});

