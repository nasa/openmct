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
This test suite is dedicated to tests which verify the basic operations surrounding moving & linking objects.
*/

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Move & link item tests', () => {
    test('Create a basic object and verify that it can be moved to another folder', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        // Go to Open MCT
        await page.goto('./');

        const parentFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Parent Folder'
        });
        const childFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Child Folder',
            parent: parentFolder.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Grandchild Folder',
            parent: childFolder.uuid
        });

        // Attempt to move parent to its own grandparent
        await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
        await page.locator('.c-disclosure-triangle >> nth=0').click();

        await page.locator(`a:has-text("Parent Folder") >> nth=0`).click({
            button: 'right'
        });

        await page.locator('li.icon-move').click();
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

        // Move Child Folder from Parent Folder to My Items
        await page.locator('.c-disclosure-triangle >> nth=0').click();
        await page.locator('.c-disclosure-triangle >> nth=1').click();

        await page.locator(`a:has-text("Child Folder") >> nth=0`).click({
            button: 'right'
        });
        await page.locator('li.icon-move').click();
        await page.locator(`form[name="mctForm"] >> text=${myItemsFolderName}`).click();

        await page.locator('text=OK').click();

        // Expect that Child Folder is in My Items, the root folder
        expect(page.locator(`text=${myItemsFolderName} >> nth=0:has(text=Child Folder)`)).toBeTruthy();
    });
    test('Create a basic object and verify that it cannot be moved to telemetry object without Composition Provider', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        // Go to Open MCT
        await page.goto('./');

        // Create Telemetry Table
        let telemetryTable = 'Test Telemetry Table';
        await page.locator('button:has-text("Create")').click();
        await page.locator('li:has-text("Telemetry Table")').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').click();
        await page.locator('text=Properties Title Notes >> input[type="text"]').fill(telemetryTable);

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
        await page.locator(`form[name="mctForm"] >> text=${myItemsFolderName}`).click();
        await page.locator('text=OK').click();

        // Open My Items
        await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();

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
        await page.locator(`text=Location Open MCT ${myItemsFolderName} >> span`).nth(3).click();
        await page.locator(`form[name="mctForm"] >> text=${telemetryTable}`).click();
        let okButton2 = await page.locator('button.c-button.c-button--major:has-text("OK")');
        let okButtonStateDisabled2 = await okButton2.isDisabled();
        expect(okButtonStateDisabled2).toBeTruthy();
    });

    test('Create a basic object and verify that it can be linked to another folder', async ({ page, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        // Go to Open MCT
        await page.goto('./');

        const parentFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Parent Folder'
        });
        const childFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Child Folder',
            parent: parentFolder.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'Grandchild Folder',
            parent: childFolder.uuid
        });

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

test.fixme('Cannot move a previously created domain object to non-peristable object in Move Modal', async ({ page }) => {
    //Create a domain object
    //Save Domain object
    //Move Object and verify that cannot select non-persistable object
    //Move Object to My Items
    //Verify successful move
});
