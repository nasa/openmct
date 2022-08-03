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
* This test suite template is to be used when creating new testsuites. It will be kept up to date with the latest improvements
* made by the Open MCT team. It will also follow our best pratices as those evolve. Please use this structure as a _reference_ and clear
* or update any references when creating a new test suite!
*
* To illustrate current best practices, we've included a mocked up test suite for Renaming a Timer domain object. In this example
* this test suite should be cloned and renamed as /e2e/tests/plugins/timer/renameTimer.e2e.spec.js
*
* Demonstrated:
* - Using appActions to leverage existing functions
* - Structure
* - @unstable annotation
* - await, expect, test, describe syntax
* - Writing a custom function for a test suite
* - Test stub for unfinished test coverage (test.fixme)
*
* The structure should follow
* 1. imports
* 2. test.describe()
* 3. -> test1
*    -> test2
*    -> test3(stub)
* 4. Any custom functions
*
*/

//Structure: Some standard Imports. Please update the required pathing
const { test, expect } = require('../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

// Structure: Try to keep a single describe block per logical groups of tests. If your test runtime exceeds 5 minutes or 500 lines, it's likely that it will need to be split.
// Annotations: Please use the @unstable tag so that our automation can pick it up as a part of our test promotion pipeline.
test.describe('Renaming Timer Object', () => {
    //Create a testcase name which will be obvious when it fails in CI
    test('Can create a new Timer object and rename it from actions Menu', async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        //We provide some helper functions in appActions like createDomainObjectWithDefaults. This example will create a Timer object
        await createDomainObjectWithDefaults(page, { type: 'Timer' });
        //Assert the object to be created and check it's name in the title
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Timer');

        const newObjectName = "Renamed Timer";
        //We've created an example of a shared function which pases the page and newObjectName values
        await renameObjectFrom3DotMenu(page, newObjectName);

        //Assert that the name has changed in the browser bar to the value we assigned above
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName);
    });
    test('An existing Timer object can be renamed twice', async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        //We provide some helper functions in appActions like createDomainObjectWithDefaults. This example will create a Timer object
        await createDomainObjectWithDefaults(page, { type: 'Timer' });
        //Expect the object to be created and check it's name in the title
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Timer');

        const newObjectName = "Renamed Timer";
        const newObjectName2 = "Re-Renamed Timer";
        //We've created an example of a shared function which pases the page and newObjectName values
        await renameObjectFrom3DotMenu(page, newObjectName);

        //Assert that the name has changed in the browser bar to the value we assigned above
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName);

        await renameObjectFrom3DotMenu(page, newObjectName2);

        //Assert that the name has changed in the browser bar to the second value
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName2);
    });

    //If you run out of time to write new tests, please stub in the missing tests in place with a test.fixme and BDD-style test steps. Someone will carry the baton!
    test.fixme('Can Rename Timer Object from Tree', async ({ page }) => {
        //Create a new object
        //Copy this object
        //Delete first object
        //Expect copied object to persist
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
