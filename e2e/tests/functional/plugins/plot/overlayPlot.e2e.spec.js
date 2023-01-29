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

test.describe.only('Overlay Plot', () => {
    test('Plot legend color is in sync with plot series color', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: "Overlay Plot"
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            parent: overlayPlot.uuid
        });

        await page.goto(overlayPlot.url);

        // navigate to plot series color palette
        await page.click('.l-browse-bar__actions__edit');
        await page.locator('li.c-tree__item.menus-to-left .c-disclosure-triangle').click();
        await page.locator('.c-click-swatch--menu').click();
        await page.locator('.c-palette__item[style="background: rgb(255, 166, 61);"]').click();

        // gets color for swatch located in legend
        const element = await page.waitForSelector('.plot-series-color-swatch');
        const color = await element.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('background-color');
        });

        expect(color).toBe('rgb(255, 166, 61)');
    });
    test('The elements pool supports dragging series into multiple y-axis buckets', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: "Overlay Plot"
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg a',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg b',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg c',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg d',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg e',
            parent: overlayPlot.uuid
        });

        await page.goto(overlayPlot.url);
        await page.click('button[title="Edit"]');

        // Expand the elements pool vertically
        await page.locator('.l-pane__handle').nth(2).hover({ trial: true });
        await page.mouse.down();
        await page.mouse.move(0, 100);
        await page.mouse.up();

        // Drag swg a, c, e into Y Axis 2
        await page.locator('#inspector-elements-tree >> text=swg a').dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));
        await page.locator('#inspector-elements-tree >> text=swg c').dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));
        await page.locator('#inspector-elements-tree >> text=swg e').dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));

        // Drag swg b into Y Axis 3
        await page.locator('#inspector-elements-tree >> text=swg b').dragTo(page.locator('[aria-label="Element Item Group Y Axis 3"]'));

        const yAxis1Group = page.getByLabel("Y Axis 1");
        const yAxis2Group = page.getByLabel("Y Axis 2");
        const yAxis3Group = page.getByLabel("Y Axis 3");

        // Verify that the elements are in the correct buckets and in the correct order
        expect(yAxis1Group.getByRole('listitem', { name: 'swg d' })).toBeTruthy();
        expect(yAxis1Group.getByRole('listitem').nth(0).getByText('swg d')).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem', { name: 'swg e' })).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem').nth(0).getByText('swg e')).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem', { name: 'swg c' })).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem').nth(1).getByText('swg c')).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem', { name: 'swg a' })).toBeTruthy();
        expect(yAxis2Group.getByRole('listitem').nth(2).getByText('swg a')).toBeTruthy();
        expect(yAxis3Group.getByRole('listitem', { name: 'swg b' })).toBeTruthy();
        expect(yAxis3Group.getByRole('listitem').nth(0).getByText('swg b')).toBeTruthy();
    });
});
