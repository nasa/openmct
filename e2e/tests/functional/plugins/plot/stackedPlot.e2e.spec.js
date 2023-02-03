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

    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('/', { waitUntil: 'networkidle' });
        stackedPlot = await createDomainObjectWithDefaults(page, {
            type: "Stacked Plot"
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg a',
            parent: stackedPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg b',
            parent: stackedPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg c',
            parent: stackedPlot.uuid
        });
    });

    test('Using the remove action removes the correct plot', async ({ page }) => {

        await page.goto(stackedPlot.url);

        await page.click('button[title="Edit"]');

        // Expand the elements pool vertically
        await page.locator('.l-pane__handle').nth(2).hover({ trial: true });
        await page.mouse.down();
        await page.mouse.move(0, 100);
        await page.mouse.up();

        await page.locator('.js-elements-pool__tree >> text=swg b').click({ button: 'right' });
        await page.locator('li[role="menuitem"]:has-text("Remove")').click();
        await page.locator('.js-overlay .js-overlay__button >> text=OK').click();

        // Wait until the number of elements in the elements pool has changed, and then confirm that the correct children were retained
        // await page.waitForFunction(() => {
        //     return Array.from(document.querySelectorAll('.js-elements-pool__tree .js-elements-pool__item')).length === 2;
        // });
        // Wait until there are only two items in the elements pool (ie the remove action has completed)
        await expect(page.locator('.js-elements-pool__tree .js-elements-pool__item')).toHaveCount(2);

        // Confirm that the elements pool contains the items we expect
        await expect(page.locator('.js-elements-pool__tree >> text=swg a')).toHaveCount(1);
        await expect(page.locator('.js-elements-pool__tree >> text=swg b')).toHaveCount(0);
        await expect(page.locator('.js-elements-pool__tree >> text=swg c')).toHaveCount(1);
    });

    test('Selecting a child plot shows it\'s properties in the inspector.', async ({ page }) => {

        await page.goto(stackedPlot.url);

        //Click on the 2nd plot canvas - There will be 2 canvases for each swg, so we click on the 3rd canvas
        await page.locator('canvas').nth(3).click();

        // Expand the elements pool vertically
        const propertiesInspector = await page.locator('.js-inspector-views');
        await expect(propertiesInspector.locator('.js-series-properties >> h2')).toContainText("Plot Series");
        await expect(propertiesInspector.locator('.js-yaxis-properties >> h2')).toContainText("Y Axis");

        const plotSeriesItems = await propertiesInspector.locator('.js-series-properties .c-object-label');
        await expect(plotSeriesItems).toContainText("swg b");
    });
});
