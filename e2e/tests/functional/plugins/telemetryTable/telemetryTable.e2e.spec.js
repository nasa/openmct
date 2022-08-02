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

const { test, expect } = require('../../../../pluginFixtures');

test.describe('Telemetry Table', () => {
    test('unpauses and filters data when paused by button and user changes bounds', async ({ page, openmctConfig }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5113'
        });

        const { myItemsFolderName } = openmctConfig;
        const bannerMessage = '.c-message-banner__message';
        const createButton = 'button:has-text("Create")';

        await page.goto('./', { waitUntil: 'networkidle' });

        // Click create button
        await page.locator(createButton).click();
        await page.locator('li:has-text("Telemetry Table")').click();

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

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            // Wait for Save Banner to appear
            page.waitForSelector(bannerMessage)
        ]);

        // focus the Telemetry Table
        await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Telemetry Table').first().click()
        ]);

        // Click pause button
        const pauseButton = page.locator('button.c-button.icon-pause');
        await pauseButton.click();

        const tableWrapper = page.locator('div.c-table-wrapper');
        await expect(tableWrapper).toHaveClass(/is-paused/);

        // Subtract 5 minutes from the current end bound datetime and set it
        const endTimeInput = page.locator('input[type="text"].c-input--datetime').nth(1);
        await endTimeInput.click();

        let endDate = await endTimeInput.inputValue();
        endDate = new Date(endDate);

        endDate.setUTCMinutes(endDate.getUTCMinutes() - 5);
        endDate = endDate.toISOString().replace(/T/, ' ');

        await endTimeInput.fill('');
        await endTimeInput.fill(endDate);
        await page.keyboard.press('Enter');

        await expect(tableWrapper).not.toHaveClass(/is-paused/);

        // Get the most recent telemetry date
        const latestTelemetryDate = await page.locator('table.c-telemetry-table__body > tbody > tr').last().locator('td').nth(1).getAttribute('title');

        // Verify that it is <= our new end bound
        const latestMilliseconds = Date.parse(latestTelemetryDate);
        const endBoundMilliseconds = Date.parse(endDate);
        expect(latestMilliseconds).toBeLessThanOrEqual(endBoundMilliseconds);
    });
});
