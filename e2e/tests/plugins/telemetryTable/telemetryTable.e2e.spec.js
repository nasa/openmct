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

const { test } = require('../../../fixtures');
const { expect } = require('@playwright/test');

test.describe('Telemetry Table', () => {
    test('unpauses when paused by button and user changes bounds', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5113'
        });

        const bannerMessage = '.c-message-banner__message';
        const createButton = 'button:has-text("Create")';

        await page.goto('/', { waitUntil: 'networkidle' });

        // Click create button
        await page.locator(createButton).click();
        await page.locator('li:has-text("Telemetry Table")').click();

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            // Wait for Save Banner to appear
            page.waitForSelector(bannerMessage)
        ]);

        // Save (exit edit mode)
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(3).click();
        await page.locator('text=Save and Finish Editing').click();

        // Click create button
        await page.locator(createButton).click();

        // add Sine Wave Generator with defaults
        await page.locator('li:has-text("Sine Wave Generator")').click();

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            // Wait for Save Banner to appear
            page.waitForSelector(bannerMessage)
        ]);

        // focus the Telemetry Table
        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Telemetry Table').first().click()
        ]);

        // Click pause button
        const pauseButton = await page.locator('button.c-button.icon-pause');
        await pauseButton.click();

        const tableWrapper = await page.locator('div.c-table-wrapper');
        await expect(tableWrapper).toHaveClass(/is-paused/);

        // Arbitrarily change end date to some time in the future
        const endTimeInput = page.locator('input[type="text"].c-input--datetime').nth(1);
        await endTimeInput.click();

        let endDate = await endTimeInput.inputValue();
        endDate = new Date(endDate);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        endDate = endDate.toISOString().replace(/T.*/, '');

        await endTimeInput.fill('');
        await endTimeInput.fill(endDate);
        await page.keyboard.press('Enter');

        await expect(tableWrapper).not.toHaveClass(/is-paused/);
    });
});
