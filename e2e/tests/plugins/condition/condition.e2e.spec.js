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
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets. Note: this
suite is sharing state between tests which is considered an anti-pattern. Implimenting in this way to
demonstrate some playwright for test developers. This pattern should not be re-used in other CRUD suites.
*/

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');

let conditionSetUrl;
let getConditionSetIdentifierFromUrl;

test.describe.serial('Condition Set CRUD Operations on @localStorage', () => {
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Condition Set
        await page.locator('li:has-text("Condition Set")').click();

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.click('text=OK')
        ]);

        //Save localStorage for future test execution
        await context.storageState({ path: './e2e/tests/recycled_storage.json' });

        //Set object identifier from url
        conditionSetUrl = await page.url();
        console.log('conditionSetUrl ' + conditionSetUrl);

        getConditionSetIdentifierFromUrl = await conditionSetUrl.split('/').pop().split('?')[0];
        console.debug('getConditionSetIdentifierFromUrl ' + getConditionSetIdentifierFromUrl);
    });
    test.afterAll(async ({ browser }) => {
        await browser.close();
    });
    //Load localStorage for subsequent tests
    test.use({ storageState: './e2e/tests/recycled_storage.json' });
    //Begin suite of tests again localStorage
    test('Condition set object properties persist in main view and inspector', async ({ page }) => {
        //Navigate to baseURL with injected localStorage
        await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });

        //Assertions on loaded Condition Set in main view
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');

        //Assertions on loaded Condition Set in Inspector
        await expect.soft(page.locator('_vue=item.name=Unnamed Condition Set')).toBeTruthy;

        //Reload Page
        await Promise.all([
            page.reload(),
            page.waitForLoadState('networkidle')
        ]);

        //Re-verify after reload
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');
        //Assertions on loaded Condition Set in Inspector
        await expect.soft(page.locator('_vue=item.name=Unnamed Condition Set')).toBeTruthy;

    });
    test('condition set object can be modified on @localStorage', async ({ page }) => {
        await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });

        //Assertions on loaded Condition Set in main view
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');

        //Update the Condition Set properties
        // Click Edit Button
        await page.locator('text=Conditions View Snapshot >> button').nth(3).click();

        //Edit Condition Set Name from main view
        await page.locator('text=Unnamed Condition Set').first().fill('Renamed Condition Set');
        await page.locator('text=Renamed Condition Set').first().press('Enter');
        // Click Save Button
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        // Click Save and Finish Editing Option
        await page.locator('text=Save and Finish Editing').click();

        //Verify Main section reflects updated Name Property
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText('Renamed Condition Set');

        // Verify Inspector properties
        // Verify Inspector has updated Name property
        await expect.soft(page.locator('text=Renamed Condition Set').nth(1)).toBeTruthy();
        // Verify Inspector Details has updated Name property
        await expect.soft(page.locator('text=Renamed Condition Set').nth(2)).toBeTruthy();

        // Verify Tree reflects updated Name proprety
        // Expand Tree
        await page.locator('text=Open MCT My Items >> span >> nth=3').click();
        // Verify Condition Set Object is renamed in Tree
        await expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
        // Verify Search Tree reflects renamed Name property
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Renamed');
        await expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();

        //Reload Page
        await Promise.all([
            page.reload(),
            page.waitForLoadState('networkidle')
        ]);

        //Verify Main section reflects updated Name Property
        await expect.soft(page.locator('.l-browse-bar__object-name')).toContainText('Renamed Condition Set');

        // Verify Inspector properties
        // Verify Inspector has updated Name property
        await expect.soft(page.locator('text=Renamed Condition Set').nth(1)).toBeTruthy();
        // Verify Inspector Details has updated Name property
        await expect.soft(page.locator('text=Renamed Condition Set').nth(2)).toBeTruthy();

        // Verify Tree reflects updated Name proprety
        // Expand Tree
        await page.locator('text=Open MCT My Items >> span >> nth=3').click();
        // Verify Condition Set Object is renamed in Tree
        await expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
        // Verify Search Tree reflects renamed Name property
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Renamed');
        await expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
    });
    test('condition set object can be deleted by Search Tree Actions menu on @localStorage', async ({ page }) => {
        //Navigate to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        const numberOfConditionSetsToStart = await page.locator('a:has-text("Unnamed Condition Set Condition Set")').count();
        //Expect Unnamed Condition Set to be visible in Main View
        await expect(page.locator('a:has-text("Unnamed Condition Set Condition Set") >> nth=0')).toBeVisible();

        // Search for Unnamed Condition Set
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Unnamed Condition Set');
        // Click Search Result
        await page.locator('[aria-label="OpenMCT Search"] >> text=Unnamed Condition Set').first().click();
        // Click hamburger button
        await page.locator('[title="More options"]').click();
        // Click text=Remove
        await page.locator('text=Remove').click();

        await page.locator('text=OK').click();

        //Expect Unnamed Condition Set to be removed in Main View
        const numberOfConditionSetsAtEnd = await page.locator('a:has-text("Unnamed Condition Set Condition Set")').count();
        expect(numberOfConditionSetsAtEnd).toEqual(numberOfConditionSetsToStart - 1);

        //Feature?
        //Domain Object is still available by direct URL after delete
        await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');

    });
});
