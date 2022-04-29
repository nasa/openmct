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
This test suite is dedicated to tests which verify the basic operations surrounding moving objects.
*/

const { test, expect } = require('@playwright/test');

test.describe('Move item tests', () => {
    test('Create a basic object and verify that it can be moved to another Folder', async ({ page }) => {

        await page.goto('http://localhost:8080/');
        await page.goto('http://localhost:8080/#/browse/mine?view=grid&tc.mode=fixed&tc.startBound=1651088948584&tc.endBound=1651090748584&tc.timeSystem=utc');

        let folder1 = "Folder 1";
        let folder2 = "Folder 2";
        // Create a new folder in the root my items folder
        await page.locator('button:has-text("Create")').click();
        await page.locator('li.icon-folder').click();

        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folder1);
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/fae88dc4-99bb-470d-aa2d-4aea0fd37866?tc.mode=fixed&tc.startBound=1651088948584&tc.endBound=1651090748584&tc.timeSystem=utc&view=grid' }*/),
            page.locator('text=OK').click()
        ]);
        // Create another folder with a new name at default location, which is currently inside Folder 1
        await page.locator('button:has-text("Create")').click();
        await page.locator('li.icon-folder').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folder2);
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/fae88dc4-99bb-470d-aa2d-4aea0fd37866/db465c17-5d36-4884-9a92-5b7a958a6639?tc.mode=fixed&tc.startBound=1651088948584&tc.endBound=1651090748584&tc.timeSystem=utc&view=grid' }*/),
            page.locator('text=OK').click()
        ]);
        // Move Folder 2 from Folder 1 to My Items
        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await page.locator('.c-tree__scrollable div div:nth-child(2) .c-tree__item .c-tree__item__view-control').click();
        await page.locator(`text=${folder2}`).first().click({
            button: 'right'
        });
        await page.locator('text=Move').first().click();
        await page.locator('form[name="mctForm"] >> text=My Items').click();
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/db465c17-5d36-4884-9a92-5b7a958a6639?tc.mode=fixed&tc.startBound=1651088948584&tc.endBound=1651090748584&tc.timeSystem=utc&view=grid' }*/),
            page.locator('text=OK').click()
        ]);
        // Expect that Folder 2 is in My Items, the root folder
        await expect(page.locator(`text=My Items >> nth=0:has(text=${folder2})`)).toBeTruthy();
    });
    test.fixme('Create a basic object and verify that it cannot be moved to object without Composition Provider', async ({ page }) => {
        //Create and save Telemetry Object
        //Create and save Domain Object
        //Verify that the newly created domain object cannot be moved to Telemetry Object from step 1.
    });
});
