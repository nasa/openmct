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
* This test suite template is to be used when creating new test suites. It will be kept up to date with the latest improvements
* made by the Open MCT team. It will also follow our best pratices as those evolve. Please use this structure as a _reference_ and clear
* or update any references when creating a new test suite!
*
* To illustrate current best practices, we've included a mocked up test suite for Renaming a Timer domain object.
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
*/

// Structure: Some standard Imports. Please update the required pathing.
const { test, expect } = require('../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Imagery Thumbnail', () => {
    // Top-level declaration of the Timer object created in beforeEach().
    // We can then use this throughout the entire test suite.
    let timer;
    test.beforeEach(async ({ page }) => {
        // Open a browser, navigate to the main page, and wait until all network events to resolve
        await page.goto('./', { waitUntil: 'networkidle' });

        // We provide some helper functions in appActions like `createDomainObjectWithDefaults()`.
        // This example will create a Timer object with default properties, under the root folder:
        timer = await createDomainObjectWithDefaults(page, { type: 'Timer' });

        // Assert the object to be created and check its name in the title
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(timer.name);
    });
    test.fixme('Images the initial, default timebounds appear in the main view as well as thumbnails', async ({ page }) => {});
    test.fixme('Images', async ({ page }) => {});
});
