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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

const { selectInspectorTab } = require('../../../../appActions');
const { test, expect } = require('../../../../pluginFixtures');

test.describe('Legend color in sync with plot color', () => {
    test('Testing', async ({ page }) => {
        await makeOverlayPlot(page);

        // navigate to plot series color palette
        await page.click('.l-browse-bar__actions__edit');
        await selectInspectorTab(page, 'Config');

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
});

async function saveOverlayPlot(page) {
    // save overlay plot
    await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();

    await Promise.all([
        page.locator('text=Save and Finish Editing').click(),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached' });
}

async function makeOverlayPlot(page) {
    // fresh page with time range from 2022-03-29 22:00:00.000Z to 2022-03-29 22:00:30.000Z
    await page.goto('/', { waitUntil: 'networkidle' });

    // create overlay plot

    await page.locator('button.c-create-button').click();
    await page.locator('li[role="menuitem"]:has-text("Overlay Plot")').click();
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle'}),
        page.locator('button:has-text("OK")').click(),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});

    // save the overlay plot

    await saveOverlayPlot(page);

    // create a sinewave generator

    await page.locator('button.c-create-button').click();
    await page.locator('li[role="menuitem"]:has-text("Sine Wave Generator")').click();

    // Click OK to make generator

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle'}),
        page.locator('button:has-text("OK")').click(),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});

    // click on overlay plot

    await page.locator('text=Open MCT My Items >> span').nth(3).click();
    await Promise.all([
        page.waitForNavigation(),
        page.locator('text=Unnamed Overlay Plot').first().click()
    ]);
}
