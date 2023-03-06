/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
Tests to verify plot tagging functionality.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults, setRealTimeMode, setFixedTimeMode } = require('../../../../appActions');

test.describe('Plot Tagging', () => {
    async function createTags({page, canvas, xEnd, yEnd}) {
        await canvas.hover({trial: true});

        //Alt+Shift Drag Start to select some points to tag
        await page.keyboard.down('Alt');
        await page.keyboard.down('Shift');

        await canvas.dragTo(canvas, {
            sourcePosition: {
                x: 1,
                y: 1
            },
            targetPosition: {
                x: xEnd,
                y: yEnd
            }
        });

        //Alt Drag End
        await page.keyboard.up('Alt');
        await page.keyboard.up('Shift');

        //Wait for canvas to stablize.
        await canvas.hover({trial: true});

        // add some tags
        await page.getByText('Annotations').click();
        await page.getByRole('button', { name: /Add Tag/ }).click();
        await page.getByPlaceholder('Type to select tag').click();
        await page.getByText('Driving').click();

        await page.getByRole('button', { name: /Add Tag/ }).click();
        await page.getByPlaceholder('Type to select tag').click();
        await page.getByText('Science').click();
    }

    async function testTelemetryItem(page, canvas, telemetryItem) {
        // Check that telemetry item also received the tag
        await page.goto(telemetryItem.url);

        await expect(page.getByText('No tags to display for this item')).toBeVisible();

        //Wait for canvas to stablize.
        await canvas.hover({trial: true});

        // click on the tagged plot point
        await canvas.click({
            position: {
                x: 325,
                y: 377
            }
        });

        await expect(page.getByText('Science')).toBeVisible();
        await expect(page.getByText('Driving')).toBeHidden();
    }

    async function basicTagsTests(page, canvas) {
        // Search for Science
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('[aria-label="Search Result"]').nth(0)).toContainText("Science");
        await expect(page.locator('[aria-label="Search Result"]').nth(0)).not.toContainText("Drilling");

        // Delete Driving
        await page.hover('[aria-label="Tag"]:has-text("Driving")');
        await page.locator('[aria-label="Remove tag Driving"]').click();

        await expect(page.locator('[aria-label="Tags Inspector"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Tags Inspector"]')).not.toContainText("Driving");

        // Search for Driving
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('driv');
        await expect(page.getByText('No results found')).toBeVisible();

        //Reload Page
        await Promise.all([
            page.reload(),
            page.waitForLoadState('networkidle')
        ]);
        // wait for plot progress bar to disappear
        await page.locator('.l-view-section.c-progress-bar').waitFor({ state: 'detached' });

        await page.getByText('Annotations').click();
        await expect(page.getByText('No tags to display for this item')).toBeVisible();

        // click on the tagged plot point
        await canvas.click({
            position: {
                x: 100,
                y: 100
            }
        });

        await expect(page.getByText('Science')).toBeVisible();
        await expect(page.getByText('Driving')).toBeHidden();
    }

    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
    });

    test('Tags work with Overlay Plots', async ({ page }) => {
        //Test.slow decorator is currently broken. Needs to be fixed in https://github.com/nasa/openmct/issues/5374
        test.slow();

        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: "Overlay Plot"
        });

        const alphaSineWave = await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: "Alpha Sine Wave",
            parent: overlayPlot.uuid
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: "Beta Sine Wave",
            parent: overlayPlot.uuid
        });

        await page.goto(overlayPlot.url);

        let canvas = page.locator('canvas').nth(1);

        // Switch to real-time mode
        // Adding tags should pause the plot
        await setRealTimeMode(page);

        await createTags({
            page,
            canvas,
            xEnd: 700,
            yEnd: 480
        });

        await setFixedTimeMode(page);

        // changing to fixed time mode rebuilds canvas?
        canvas = page.locator('canvas').nth(1);

        await basicTagsTests(page, canvas);
        await testTelemetryItem(page, canvas, alphaSineWave);
    });

    test('Tags work with Plot View of telemetry items', async ({ page }) => {
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator"
        });

        const canvas = page.locator('canvas').nth(1);
        await createTags({
            page,
            canvas,
            xEnd: 700,
            yEnd: 480
        });
        await basicTagsTests(page, canvas);
    });

    test('Tags work with Stacked Plots', async ({ page }) => {
        const stackedPlot = await createDomainObjectWithDefaults(page, {
            type: "Stacked Plot"
        });

        const alphaSineWave = await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: "Alpha Sine Wave",
            parent: stackedPlot.uuid
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: "Beta Sine Wave",
            parent: stackedPlot.uuid
        });

        await page.goto(stackedPlot.url);

        const canvas = page.locator('canvas').nth(1);

        await createTags({
            page,
            canvas,
            xEnd: 700,
            yEnd: 215
        });
        await basicTagsTests(page, canvas);
        await testTelemetryItem(page, canvas, alphaSineWave);
    });
});
