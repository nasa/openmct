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
Tests to verify plot tagging functionality.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe.only('Plot Tagging', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
    });

    test('Plot legend color is in sync with plot series color', async ({ page }) => {
        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: "Overlay Plot"
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            parent: overlayPlot.uuid
        });

        await page.goto(overlayPlot.url);

        const canvas = page.locator('canvas').nth(1);

        await canvas.hover({trial: true});

        //Alt+Shift Drag Start
        await page.keyboard.down('Alt');
        await page.keyboard.down('Shift');

        await canvas.dragTo(canvas, {
            sourcePosition: {
                x: 200,
                y: 200
            },
            targetPosition: {
                x: 400,
                y: 400
            }
        });

        //Alt Drag End
        await page.keyboard.up('Alt');
        await page.keyboard.up('Shift');

        //Wait for canvas to stablize.
        await canvas.hover({trial: true});

        await page.getByText('Annotations').click();
        await page.getByRole('button', { name: /Add Tag/ }).click();
        await page.getByPlaceholder('Type to select tag').click();
        await page.getByText('Driving').click();

        await page.getByRole('button', { name: /Add Tag/ }).click();
        await page.getByPlaceholder('Type to select tag').click();
        await page.getByText('Science').click();

        // Search for Science
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
        await expect(page.locator('[aria-label="Search Result"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Search Result"]')).not.toContainText("Drilling");

        // Delete Driving
        await page.hover('[aria-label="Tag"]:has-text("Driving")');
        await page.locator('[aria-label="Remove tag Driving"]').click();

        await expect(page.locator('[aria-label="Tags Inspector"]')).toContainText("Science");
        await expect(page.locator('[aria-label="Tags Inspector"]')).not.toContainText("Driving");

        // Search for Driving
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('driv');
        await expect(page.locator('text=No results found')).toBeVisible();

        //Reload Page
        await Promise.all([
            page.reload(),
            page.waitForLoadState('networkidle')
        ]);

        await page.pause();
    });
});
