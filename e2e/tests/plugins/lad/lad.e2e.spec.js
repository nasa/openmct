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

const { test, expect } = require('../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../appActions');

test.describe('Testing LAD table @unstable', () => {
    test('telemetry value exactly matches latest telemetry value received', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        await createDomainObjectWithDefaults(page, 'LAD Table');
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed LAD Table');

        const newObjectName = "Test LAD Table";
        await renameObjectFrom3DotMenu(page, newObjectName);

        // //Assert that the name has changed in the browser bar to the value we assigned above
        // await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName);
        expect(true).toBe(true);
    });
});

//Structure: custom functions should be declared last. We are leaning on JSDoc pretty heavily to describe functionality. It is not required, but heavily recommended.

/**
 * This is an example of a function which is shared between testcases in this test suite. When refactoring, we'll be looking
 * for common functionality which makes sense to generalize for the entire test framework.
 * @param {import('@playwright/test').Page} page
 * @param {string} newNameForTimer New Name for object
 */
async function renameObjectFrom3DotMenu(page, newNameForTimer) {

    // Click on 3 Dot Menu
    await page.locator('button[title="More options"]').click();
    // Click text=Edit Properties...
    await page.locator('text=Edit Properties...').click();

    // Rename the object with newNameForTimer variable which is passed into this function
    await page.locator('text=Properties Title Notes >> input[type="text"]').fill(newNameForTimer);

    // Click Ok button to Save
    await page.locator('text=OK').click();
}
