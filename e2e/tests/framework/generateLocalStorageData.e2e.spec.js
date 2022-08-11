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
This test suite is dedicated to generating LocalStorage via Session Storage to be used
in some visual test suites like controlledClock.visual.spec.js. This suite should run to completion
and generate an artifact in./e2e/test-data/<name>_storage.json . This will run
on every Commit to ensure that this object still loads into tests correctly and will retain the
.e2e.spec.js suffix.

TODO: Provide addition`al validation of object properties as it grows.

*/

const { test, expect } = require('../../pluginFixtures.js');
const { createDomainObjectWithDefaults, createExampleTelemetryObject } = require('../../appActions.js');

test.describe('Generate Visual Test Data @localStorage', () => {
    // test.use({
    //     clockOptions: {
    //         shouldAdvanceTime: false //Don't advance the clock
    //     }
    // });
    //            page.evaluate(() => window.__clock.tick(1000)), //tick clock to trigger Navigation event

    test('Generate Overlay Plot with Telemetry Object @localStorage', async ({ page, context }) => {
        const overlayPlotName = 'Overlay Plot with Telemetry Object';

        //Go to baseURL
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });

        //Create Overlay Plot. Will end in Edit Mode
        await createDomainObjectWithDefaults(page, 'Overlay Plot', overlayPlotName);

        //Save without Changes in Edit Mode
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        await page.locator('text=Save and Finish Editing').click();

        //Create Telemetry Object
        await createExampleTelemetryObject(page);

        //Make Link to from Telemetry Object to Overlay Plot
        ////
        await page.locator('text=Plot Snapshot >> button').nth(2).click();

        //// Click text=Create Link
        await page.locator('text=Create Link').click();

        //// Search and Select for overlay Plot within Create Modal
        await page.locator('text=location Open MCT My Items >> [aria-label="Search Input"]').click();
        await page.locator('text=location Open MCT My Items >> [aria-label="Search Input"]').fill(overlayPlotName);
        await page.locator('a:has-text("' + overlayPlotName + '")').click();
        await page.locator('text=OK').click();

        await page.locator('button:has-text("Browse")').click();

        //TODO Flesh Out Assertions against created Objects
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlotName);

        //TODO
        // Modify the Overlay Plot to use fixed Scaling
        // Todo Verify Autoscaling.

        //Save localStorage for future test execution
        await context.storageState({ path: './e2e/test-data/overlay_plot_storage.json' });
    });
    test('Generate Overlay Plot with 5s Delay @localStorage', async ({ page, context }) => {

        //Go to baseURL
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Create")').click();

        // add overlay plot with defaults
        await page.locator('li:has-text("Overlay Plot")').click();

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);

        // save (exit edit mode)
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        await page.locator('text=Save and Finish Editing').click();

        // click create button
        await page.locator('button:has-text("Create")').click();

        // add sine wave generator with defaults
        await page.locator('li:has-text("Sine Wave Generator")').click();

        //Add a 5000 ms Delay
        await page.locator('[aria-label="Loading Delay \\(ms\\)"]').fill('5000');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            //Wait for Save Banner to appear1
            page.waitForSelector('.c-message-banner__message')
        ]);

        // focus the overlay plot
        await page.locator(`text=Open MCT >> span`).nth(3).click();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Overlay Plot').first().click()
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Overlay Plot');
        //Save localStorage for future test execution
        await context.storageState({ path: './e2e/test-data/overlay_plot_with_delay_storage.json' });
    });
});
