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

const { test } = require('../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Move item tests', () => {
    test('Create a basic object and verify that it can be moved to another folder', async ({ page }) => {
        // Go to Open MCT
        await page.goto('/');

        // Create a new folder in the root my items folder
        let folder1 = "Folder1";
        await page.locator('button:has-text("Create")').click();
        await page.locator('li.icon-folder').click();

        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folder1);

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.locator('.c-message-banner__close-button').click();
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});

        // Create another folder with a new name at default location, which is currently inside Folder 1
        let folder2 = "Folder2";
        await page.locator('button:has-text("Create")').click();
        await page.locator('li.icon-folder').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folder2);

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.locator('.c-message-banner__close-button').click();
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});

        // Move Folder 2 from Folder 1 to My Items
        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await page.locator('.c-tree__scrollable div div:nth-child(2) .c-tree__item .c-tree__item__view-control').click();

        await page.locator(`a:has-text("${folder2}")`).click({
            button: 'right'
        });
        await page.locator('li.icon-move').click();
        await page.locator('form[name="mctForm"] >> text=My Items').click();

        await page.locator('text=OK').click();

        // Expect that Folder 2 is in My Items, the root folder
        expect(page.locator(`text=My Items >> nth=0:has(text=${folder2})`)).toBeTruthy();
    });
    test('Create a basic object and verify that it cannot be moved to telemetry object without Composition Provider', async ({ page }) => {
        // Go to Open MCT
        await page.goto('/');

        // Create Telemetry Table
        let telemetryTable = 'Test Telemetry Table';
        await page.locator('button:has-text("Create")').click();
        await page.locator('li:has-text("Telemetry Table")').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(telemetryTable);

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        await page.locator('text=OK').click();

        // Finish editing and save Telemetry Table
        await page.locator('.c-button--menu.c-button--major.icon-save').click();
        await page.locator('text=Save and Finish Editing').click();

        // Create New Folder Basic Domain Object
        let folder = 'Test Folder';
        await page.locator('button:has-text("Create")').click();
        await page.locator('li:has-text("Folder")').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(folder);

        // See if it's possible to put the folder in the Telemetry object during creation (Soft Assert)
        await page.locator(`form[name="mctForm"] >> text=${telemetryTable}`).click();
        let okButton = await page.locator('button.c-button.c-button--major:has-text("OK")');
        let okButtonStateDisabled = await okButton.isDisabled();
        expect.soft(okButtonStateDisabled).toBeTruthy();

        // Continue test regardless of assertion and create it in My Items
        await page.locator('form[name="mctForm"] >> text=My Items').click();
        await page.locator('text=OK').click();

        // Open My Items
        await page.locator('text=Open MCT My Items >> span').nth(3).click();

        // Select Folder Object and select Move from context menu
        await Promise.all([
            page.waitForNavigation(),
            page.locator(`a:has-text("${folder}")`).click()
        ]);
        await page.locator('.c-tree__item.is-navigated-object .c-tree__item__label .c-tree__item__type-icon').click({
            button: 'right'
        });
        await page.locator('li.icon-move').click();

        // See if it's possible to put the folder in the Telemetry object after creation
        await page.locator('text=Location Open MCT My Items >> span').nth(3).click();
        await page.locator(`form[name="mctForm"] >> text=${telemetryTable}`).click();
        let okButton2 = await page.locator('button.c-button.c-button--major:has-text("OK")');
        let okButtonStateDisabled2 = await okButton2.isDisabled();
        expect(okButtonStateDisabled2).toBeTruthy();
    });
});
