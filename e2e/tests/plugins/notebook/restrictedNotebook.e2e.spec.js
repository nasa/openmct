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


// test.fixme('make sure locks show for page and the section that page is in');
// test.fixme('make sure you can nott edit section titles or section names if locked');
// test.fixme('try to delete/edit an entry from a locked notebook (you should not be able)');
// test.fixme('try to remove an embed from a locked page entry (make sure you can preview though)');
// test.fixme('make sure if the notebook section/page was default, that it was NOT default once locked');
// test.fixme('try to drop an item into a locked page (you should not be able), do the same with a snapshot');
// test.fixme('make sure search works as expected');
// test.fixme('in search, make sure there are locked and unlocked page entries with embeds, make sure you can remove unlocked ones and not remove locked ones');

const { test, expect } = require('@playwright/test');
const path = require('path');

const TEST_TEXT = 'Testing text for entries.';
const CUSTOM_NAME = 'CUSTOM_NAME';
const COMMIT_BUTTON_TEXT = 'button:has-text("Commit Entries")';

async function enterTextEntry(page) {
    // Click .c-notebook__drag-area
    await page.locator('.c-notebook__drag-area').click();

    // enter text
    await page.locator('div.c-ne__text').click();
    await page.locator('div.c-ne__text').fill(TEST_TEXT);
    await page.locator('div.c-ne__text').press('Enter');

    return;
}

async function openContextMenuRestrictedNotebook(page) {
    // Click text=Open MCT My Items >> span >> nth=3
    await page.locator('text=Open MCT My Items >> span').nth(3).click();

    // Click a:has-text("Unnamed CUSTOM_NAME")
    await page.locator(`a:has-text("Unnamed ${CUSTOM_NAME}")`).click({
        button: 'right'
    });

    return;
}

test.describe('Restricted Notebook', () => {

    test.beforeEach(async ({ page }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, 'addRestrictedNotebook.js') });

        page.on('console', msg => console.log(msg.text()));

        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click(`text=${CUSTOM_NAME}`); // this inherently tests renamability

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(`Unnamed ${CUSTOM_NAME}`);
    });

    test('Can be deleted if there are no locked pages', async ({ page }) => {
        await openContextMenuRestrictedNotebook(page);

        const menuOptions = page.locator('.c-menu ul');

        await expect.soft(menuOptions).toContainText('Remove');
    });

    test('Can be locked if at least one page has one entry', async ({ page }) => {

        await enterTextEntry(page);

        const commitButton = page.locator(COMMIT_BUTTON_TEXT);
        expect.soft(commitButton).toBeDefined();
    });

    test.describe('With at least one entry and with the page locked', () => {

        test.beforeEach(async ({ page }) => {
            await enterTextEntry(page);

            const commitButton = page.locator(COMMIT_BUTTON_TEXT);
            await commitButton.click();

            // confirmation dialog click
            await page.locator('text=Lock Page').click();

            // open sidebar
            await page.locator('button.c-notebook__toggle-nav-button').click();
        });

        test('The page should now be in a locked state', async ({ page }) => {
            // main lock message on page
            const lockMessage = page.locator('text=This page has been committed and cannot be modified or removed');
            expect(lockMessage).toBeDefined();

            // lock icon on page in sidebar
            const pageLockIcon = page.locator('ul.c-notebook__pages li div.icon-lock');
            expect(pageLockIcon).toBeDefined();

            // no way to remove a restricted notebook with a locked page
            await openContextMenuRestrictedNotebook(page);

            const menuOptions = page.locator('.c-menu ul');

            await expect.soft(menuOptions).not.toContainText('Remove');

        });

        test.only('Some features should still be available', async ({ page }) => {
            const lockMessage = page.locator('text=This page has been committed and cannot be modified or removed');
            await page.pause();

            expect(lockMessage).toBeDefined();
        });
    });

});
