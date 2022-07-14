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
This test suite is dedicated to tests which verify the basic operations surrounding the example event generator.
*/

const { test } = require('../../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Example Event Generator Operations', () => {
    test('Can create example event generator with a name', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });
        // let's make an event generator
        await page.locator('button:has-text("Create")').click();
        // Click li:has-text("Event Message Generator")
        await page.locator('li:has-text("Event Message Generator")').click();
        // Click text=Properties Title Notes >> input[type="text"]
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        // Fill text=Properties Title Notes >> input[type="text"]
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill('Test Event Generator');
        // Press Enter
        await page.locator('text=Properties Title Notes >> input[type="text"]').press('Enter');
        // Click text=OK
        await Promise.all([
            page.waitForNavigation({ url: /.*&view=table/ }),
            page.locator('text=OK').click()
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Test Event Generator');
        // Click button:has-text("Fixed Timespan")
        await page.locator('button:has-text("Fixed Timespan")').click();
    });

    test.fixme('telemetry is coming in for test event', async ({ page }) => {
        // Go to object created in step one
        // Verify the telemetry table is filled with > 1 row
    });
    test.fixme('telemetry is sorted by time ascending', async ({ page }) => {
        // Go to object created in step one
        // Verify the telemetry table has a class with "is-sorting asc"
    });
});
