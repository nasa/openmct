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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Stacked Plot', () => {
    let stackedPlot;
    let swgA;
    let swgB;
    let swgC;

    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('/', { waitUntil: 'networkidle' });
        stackedPlot = await createDomainObjectWithDefaults(page, {
            type: "Stacked Plot"
        });

        swgA = await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            parent: stackedPlot.uuid
        });
        swgB = await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            parent: stackedPlot.uuid
        });
        swgC = await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            parent: stackedPlot.uuid
        });
    });

    test('Using the remove action removes the correct plot', async ({ page }) => {
        const swgAElementsPoolItem = page.locator('#inspector-elements-tree').locator('.c-object-label', { hasText: swgA.name });
        const swgBElementsPoolItem = page.locator('#inspector-elements-tree').locator('.c-object-label', { hasText: swgB.name });
        const swgCElementsPoolItem = page.locator('#inspector-elements-tree').locator('.c-object-label', { hasText: swgC.name });

        await page.goto(stackedPlot.url);

        await page.click('button[title="Edit"]');

        // Expand the elements pool vertically
        await page.locator('.l-pane__handle').nth(2).hover({ trial: true });
        await page.mouse.down();
        await page.mouse.move(0, 100);
        await page.mouse.up();

        await swgBElementsPoolItem.click({ button: 'right' });
        await page.getByRole('menuitem').filter({ hasText: /Remove/ }).click();
        await page.getByRole('button').filter({ hasText: "OK" }).click();

        await expect(page.locator('#inspector-elements-tree .js-elements-pool__item')).toHaveCount(2);

        // Confirm that the elements pool contains the items we expect
        await expect(swgAElementsPoolItem).toHaveCount(1);
        await expect(swgBElementsPoolItem).toHaveCount(0);
        await expect(swgCElementsPoolItem).toHaveCount(1);
    });

    test('Selecting a child plot while in browse and edit modes shows its properties in the inspector', async ({ page }) => {
        await page.goto(stackedPlot.url);

        // Click on the 1st plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgA.name}"] canvas`).nth(1).click();

        // Assert that the inspector shows the Y Axis properties for swgA
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgA.name);

        // Click on the 2nd plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgB.name}"] canvas`).nth(1).click();

        // Assert that the inspector shows the Y Axis properties for swgB
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgB.name);

        // Click on the 3rd plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgC.name}"] canvas`).nth(1).click();

        // Assert that the inspector shows the Y Axis properties for swgC
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgC.name);

        // Go into edit mode
        await page.click('button[title="Edit"]');

        // Click on canvas for the 1st plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgA.name}"]`).click();

        // Assert that the inspector shows the Y Axis properties for swgA
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgA.name);

        //Click on canvas for the 2nd plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgB.name}"]`).click();

        // Assert that the inspector shows the Y Axis properties for swgB
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgB.name);

        //Click on canvas for the 3rd plot
        await page.locator(`[aria-label="Stacked Plot Item ${swgC.name}"]`).click();

        // Assert that the inspector shows the Y Axis properties for swgC
        await expect(page.locator('[aria-label="Plot Series Properties"] >> h2')).toContainText("Plot Series");
        await expect(page.getByRole('list', { name: "Y Axis Properties" }).locator("h2")).toContainText("Y Axis");
        await expect(page.locator('[aria-label="Plot Series Properties"] .c-object-label')).toContainText(swgC.name);
    });
});
