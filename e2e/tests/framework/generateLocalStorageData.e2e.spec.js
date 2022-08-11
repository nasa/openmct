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

/**
 * This test suite is dedicated to generating LocalStorage via Session Storage to be used
 * in some visual test suites like controlledClock.visual.spec.js. This suite should run to completion
 * and generate an artifact in ./e2e/test-data/<name>_storage.json . This will run
 * on every commit to ensure that this object still loads into tests correctly and will retain the
 * *.e2e.spec.js suffix.
 *
 * TODO: Provide additional validation of object properties as it grows.
 */

const { test, expect } = require('../../pluginFixtures.js');
const { createDomainObjectWithDefaults, createExampleTelemetryObject } = require('../../appActions.js');

test.describe('Generate Visual Test Data @localStorage', () => {

    test('Generate Overlay Plot with Telemetry Object @localStorage', async ({ page, context }) => {
        const overlayPlotName = 'Overlay Plot with Telemetry Object';

        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create Overlay Plot
        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: 'Overlay Plot',
            name: overlayPlotName
        });

        // Create Telemetry Object
        await createExampleTelemetryObject(page);

        // Make Link from Telemetry Object to Overlay Plot
        await page.locator('text=Plot Snapshot >> button').nth(2).click();

        // Click text=Create Link
        await page.locator('text=Create Link').click();

        // Search and Select for overlay Plot within Create Modal
        await page.locator('text=location Open MCT My Items >> [aria-label="Search Input"]').click();
        await page.locator('text=location Open MCT My Items >> [aria-label="Search Input"]').fill(overlayPlot.name);
        await page.locator(`a:has-text("${overlayPlot.name}")`).click();
        await page.locator('text=OK').click();

        await page.goto(overlayPlot.url);

        // TODO: Flesh Out Assertions against created Objects
        await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlotName);

        // TODO: Modify the Overlay Plot to use fixed Scaling
        // TODO: Verify Autoscaling.

        // Save localStorage for future test execution
        await context.storageState({ path: './e2e/test-data/overlay_plot_storage.json' });
    });
    test('Generate Overlay Plot with 5s Delay @localStorage', async ({ page, context }) => {
        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // add overlay plot with defaults
        const overlayPlot = await createDomainObjectWithDefaults(page, { type: 'Overlay Plot' });

        // click create button
        await page.locator('button:has-text("Create")').click();

        // add sine wave generator with 5000ms delay
        await page.locator('li:has-text("Sine Wave Generator")').click();
        await page.locator('[aria-label="Loading Delay \\(ms\\)"]').fill('5000');

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click(),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);

        // focus the overlay plot
        await page.goto(overlayPlot.url);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlot.name);

        //Save localStorage for future test execution
        await context.storageState({ path: './e2e/test-data/overlay_plot_with_delay_storage.json' });
    });
});
