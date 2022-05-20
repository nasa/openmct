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

test.describe('Time counductor operations', () => {
    test('validate start time does not exceeds end time', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });
        const year = new Date().getFullYear();

        let startDate = 'xxxx-01-01 01:00:00.000Z';
        startDate = year + startDate.substring(4);

        let endDate = 'xxxx-01-01 02:00:00.000Z';
        endDate = year + endDate.substring(4);

        const startTimeLocator = page.locator('input[type="text"]').first();
        const endTimeLocator = page.locator('input[type="text"]').nth(1);

        // Click start time
        await startTimeLocator.click();

        // Click end time
        await endTimeLocator.click();

        await endTimeLocator.fill(endDate.toString());
        await startTimeLocator.fill(startDate.toString());

        // invalid start date
        startDate = (year + 1) + startDate.substring(4);
        await startTimeLocator.fill(startDate.toString());
        await endTimeLocator.click();

        const startDateValidityStatus = await startTimeLocator.evaluate((element) => element.checkValidity());
        expect(startDateValidityStatus).not.toBeTruthy();

        // fix to valid start date
        startDate = (year - 1) + startDate.substring(4);
        await startTimeLocator.fill(startDate.toString());

        // invalid end date
        endDate = (year - 2) + endDate.substring(4);
        await endTimeLocator.fill(endDate.toString());
        await startTimeLocator.click();

        const endDateValidityStatus = await endTimeLocator.evaluate((element) => element.checkValidity());
        expect(endDateValidityStatus).not.toBeTruthy();
    });
});

// Testing instructions:
// Try to change the realtime offsets when in realtime (local clock) mode.
test.describe('Time conductor input fields real-time mode', () => {
    test('validate input fields in real-time mode', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click fixed timespan button
        await page.locator('.c-button__label >> text=Fixed Timespan').click();

        // Click local clock
        await page.locator('.icon-clock >> text=Local Clock').click();

        // Click time offset button
        await page.locator('.c-conductor__delta-button >> text=00:30:00').click();

        // Input start time offset
        await page.fill('.pr-time-controls__secs', '23');

        // Click the check button
        await page.locator('.icon-check').click();

        // Verify time was updated on time offset button
        await expect(page.locator('.c-conductor__delta-button').first()).toContainText('00:30:23');

        // Click time offset set preceding now button
        await page.locator('.c-conductor__delta-button >> text=00:00:30').click();

        // Input preceding time offset
        await page.fill('.pr-time-controls__secs', '31');

        // Click the check buttons
        await page.locator('.icon-check').click();

        // Verify time was updated on preceding time offset button
        await expect(page.locator('.c-conductor__delta-button').nth(1)).toContainText('00:00:31');
    });
});
