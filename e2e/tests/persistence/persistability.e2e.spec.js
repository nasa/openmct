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
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets.
*/

const { test } = require('../../fixtures.js');
const { expect } = require('@playwright/test');
const path = require('path');

test.describe('Persistence operations @addInit', () => {
    // add non persistable root item
    test.beforeEach(async ({ page }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, 'addNoneditableObject.js') });
    });

    test('Persistability should be respected in the create form location field', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/4323'
        });
        // Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Condition Set
        await page.click('text=Condition Set');

        // Click form[name="mctForm"] >> text=Persistence Testing
        await page.locator('form[name="mctForm"] >> text=Persistence Testing').click();

        // Check that "OK" button is disabled
        const okButton = page.locator('button:has-text("OK")');
        await expect(okButton).toBeDisabled();
    });
    test('Non-persistable objects should not show persistence related actions', async ({ page }) => {
        // Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click text=Persistence Testing >> nth=0
        await page.locator('text=Persistence Testing').first().click({
            button: 'right'
        });

        const menuOptions = page.locator('.c-menu ul');

        await expect.soft(menuOptions).toContainText(['Open In New Tab', 'View', 'Create Link']);
        await expect(menuOptions).not.toContainText(['Move', 'Duplicate', 'Remove', 'Add New Folder', 'Edit Properties...', 'Export as JSON', 'Import from JSON']);
    });
    test.fixme('Cannot move a previously created domain object to non-peristable boject in Move Modal', async ({ page }) => {
        //Create a domain object
        //Save Domain object
        //Move Object and verify that cannot select non-persistable object
        //Move Object to My Items
        //Verify successful move
    });
});
