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

const { test, expect } = require('../../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Compass Rose Verification', () => {
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
    test.fixme('When locked and unlocked, Compass rose will fix North to be up and back to original position @gds', async ({ page }) => {
        //Detect orientation of compass rose in default position
        //Click on Compass Rose
        //Verify that North is up
        //Click on Compass Rose
        //Verify that North returns to original position
    });
    test.fixme('Compass Rose is visible on images which contain necessary telemetry @gds', async ({ page }) => {
        //Rover Heading
        //Camera Field of Vue
        //North
    });
    test.fixme('Compass Rose is not visible on images which do not contain necessary telemetry', async ({ page }) => {
        //TODO Understand this scenario
    });
});

test.describe('Compass HUD Verification', () => {

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
    test.fixme('Compass HUD is displayed ontop of imagery @gds', async ({ page }) => {
        //Compass HUD appears over imagery
    });
});
