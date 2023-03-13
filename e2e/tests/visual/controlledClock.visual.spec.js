/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
Collection of Visual Tests set to run with browser clock manipulate made possible with the
clockOptions plugin fixture.
*/

const { test, expect } = require('../../pluginFixtures');
const { setFixedTimeMode } = require('../../appActions');
const percySnapshot = require('@percy/playwright');

test.describe.only('Visual - Controlled Clock', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
    });
    test.use({
        storageState: './e2e/test-data/overlay_plot_with_delay_storage.json',
        clockOptions: {
            shouldAdvanceTime: false //Don't advance the clock
        }
    });

    test('Visual - Time Conductor start time is less than end time', async ({ page, theme }) => {
        await setFixedTimeMode(page);
        const startTimeInput = page.locator('input[type="text"].c-input--datetime').nth(0);
        const endTimeInput = page.locator('input[type="text"].c-input--datetime').nth(1);

        await page.locator('a').filter({ hasText: 'Overlay Plot with Telemetry Object Overlay Plot' }).click();
        //Ensure that we're on the Unnamed Overlay Plot object
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Overlay Plot with Telemetry Object');

        let date = await endTimeInput.inputValue();
        date = new Date(date);

        date.setUTCMinutes(date.getUTCMinutes() + 5);
        const startDate = date.toISOString().replace(/T/, ' ');

        // Fill start time with a value >= the current end time
        await startTimeInput.fill('');
        await startTimeInput.fill(startDate);
        await page.keyboard.press('Enter');

        //  verify error msg for start time (unable to capture snapshot of popup)
        await percySnapshot(page, `Start time error (theme: '${theme}')`);

        date.setUTCMinutes(date.getUTCMinutes() - 15);
        const endDate = date.toISOString().replace(/T/, ' ');

        // Fill end time with a value <= the current start time
        await endTimeInput.fill('');
        await endTimeInput.fill(endDate);
        await page.keyboard.press('Enter');

        // verify error msg for end time (unable to capture snapshot of popup)
        await percySnapshot(page, `End time error (theme: '${theme}')`);
    });
});
