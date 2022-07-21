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

const { test, expect } = require('@playwright/test');

const TEST_FOLDER = 'test folder';

test.describe('forms set', () => {
    test('New folder form has title as required field', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click button:has-text("Create")
        await page.click('button:has-text("Create")');
        // Click :nth-match(:text("Folder"), 2)
        await page.click(':nth-match(:text("Folder"), 2)');
        // Click text=Properties Title Notes >> input[type="text"]
        await page.click('text=Properties Title Notes >> input[type="text"]');
        // Fill text=Properties Title Notes >> input[type="text"]
        await page.fill('text=Properties Title Notes >> input[type="text"]', '');
        // Press Tab
        await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

        const okButton = page.locator('text=OK');

        await expect(okButton).toBeDisabled();
        await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/invalid/);

        // Click text=Properties Title Notes >> input[type="text"]
        await page.click('text=Properties Title Notes >> input[type="text"]');
        // Fill text=Properties Title Notes >> input[type="text"]
        await page.fill('text=Properties Title Notes >> input[type="text"]', TEST_FOLDER);
        // Press Tab
        await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

        await expect(page.locator('.c-form-row__state-indicator').first()).not.toHaveClass(/invalid/);

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.click('text=OK')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText(TEST_FOLDER);
    });
    test.fixme('Create all object types and verify correctness', async ({ page }) => {
        //Create the following Domain Objects with their unique Object Types
        // Sine Wave Generator (number object)
        // Timer Object
        // Plan View Object
        // Clock Object
        // Hyperlink
    });
});
