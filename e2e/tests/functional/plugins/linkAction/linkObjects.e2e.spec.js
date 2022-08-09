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
This test suite is dedicated to tests which verify the basic operations surrounding linking objects.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createFolderInDefaultLocation } = require('../../../../appActions');

test.describe('Link item tests', () => {
    test('Create a basic object and verify that it can be linked to another folder', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        // Go to Open MCT
        await page.goto('./');

        // Create a new folder in the root my items folder
        await createFolderInDefaultLocation(page, "Parent Folder");

        // Create another folder with a new name at default location, which is currently inside Parent Folder
        await createFolderInDefaultLocation(page, "Child Folder");

        // Create another folder with a new name at default location, which is currently inside Child Folder
        await createFolderInDefaultLocation(page, "Grandchild Folder");

        // Attempt to link parent to its own grandparent
        await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
        await page.locator('.c-disclosure-triangle >> nth=0').click();

        await page.locator(`a:has-text("Parent Folder") >> nth=0`).click({
            button: 'right'
        });

        await page.locator('li.icon-link').click();
        await page.locator('form[name="mctForm"] >> .c-disclosure-triangle >> nth=0').click();
        await page.locator('form[name="mctForm"] >> text=Parent Folder').click();
        await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
        await page.locator('form[name="mctForm"] >> .c-disclosure-triangle >> nth=1').click();
        await page.locator('form[name="mctForm"] >> text=Child Folder').click();
        await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
        await page.locator('form[name="mctForm"] >> .c-disclosure-triangle >> nth=2').click();
        await page.locator('form[name="mctForm"] >> text=Grandchild Folder').click();
        await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
        await page.locator('form[name="mctForm"] >> text=Parent Folder').click();
        await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
        await page.locator('[aria-label="Cancel"]').click();

        // Link Child Folder from Parent Folder to My Items
        await page.locator('.c-disclosure-triangle >> nth=0').click();
        await page.locator('.c-disclosure-triangle >> nth=1').click();

        await page.locator(`a:has-text("Child Folder") >> nth=0`).click({
            button: 'right'
        });
        await page.locator('li.icon-link').click();
        await page.locator(`form[name="mctForm"] >> text=${myItemsFolderName}`).click();

        await page.locator('text=OK').click();

        // Expect that Child Folder is in My Items, the root folder
        expect(page.locator(`text=${myItemsFolderName} >> nth=0:has(text=Child Folder)`)).toBeTruthy();
    });
});

