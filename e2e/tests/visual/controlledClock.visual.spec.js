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

const { test } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');

test.describe('Visual - Controlled Clock', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
    });
    test.use({
        clockOptions: {
            shouldAdvanceTime: false //Don't advance the clock
        }
    });

    test('Visual - Time Conductor start time is less than end time', async ({ page, theme }) => {
        const year = new Date().getFullYear();

        let startDate = 'xxxx-01-01 01:00:00.000Z';
        startDate = year + startDate.substring(4);

        let endDate = 'xxxx-01-01 02:00:00.000Z';
        endDate = year + endDate.substring(4);

        await page.locator('input[type="text"]').nth(1).fill(endDate.toString());
        await page.locator('input[type="text"]').first().fill(startDate.toString());

        //  verify no error msg
        await percySnapshot(page, `Default Time conductor (theme: '${theme}')`);

        startDate = (year + 1) + startDate.substring(4);
        await page.locator('input[type="text"]').first().fill(startDate.toString());
        await page.locator('input[type="text"]').nth(1).click();

        //  verify error msg for start time (unable to capture snapshot of popup)
        await percySnapshot(page, `Start time error (theme: '${theme}')`);

        startDate = (year - 1) + startDate.substring(4);
        await page.locator('input[type="text"]').first().fill(startDate.toString());

        endDate = (year - 2) + endDate.substring(4);
        await page.locator('input[type="text"]').nth(1).fill(endDate.toString());

        await page.locator('input[type="text"]').first().click();

        //  verify error msg for end time (unable to capture snapshot of popup)
        await percySnapshot(page, `End time error (theme: '${theme}')`);
    });
});
