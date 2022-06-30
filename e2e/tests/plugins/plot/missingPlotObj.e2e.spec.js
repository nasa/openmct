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

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Handle missing object for plots', () => {
    test('Displays empty div for missing stacked plot item', async ({ page }) => {
        //Make stacked plot
        await makeStackedPlot(page);

        //Gets local storage and deletes the last sine wave generator in the stacked plot
        const localStorage = await page.evaluate(() => window.localStorage);
        const parsedData = JSON.parse(localStorage.mct);
        const keys = Object.keys(parsedData);
        const lastKey = keys[keys.length - 1];

        delete parsedData[lastKey];

        //Sets local storage with missing object
        await page.evaluate(
            `window.localStorage.setItem('mct', '${JSON.stringify(parsedData)}')`
        );

        //Reloads page and clicks on stacked plot
        page.reload();

        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Stacked Plot').first().click()
        ]);

        //Check that there is only one stacked item plot with a plot, the missing one will be empty
        await expect(page.locator(".c-plot--stacked-container:has(.gl-plot)")).toHaveCount(1);
    });
});

async function makeStackedPlot(page) {
    // fresh page with time range from 2022-03-29 22:00:00.000Z to 2022-03-29 22:00:30.000Z
    await page.goto('/', { waitUntil: 'networkidle' });

    // create stacked plot
    await page.locator('button.c-create-button').click();
    await page.locator('li:has-text("Stacked Plot")').click();

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle'}),
        page.locator('text=OK').click(),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});

    // save the stacked plot
    await saveStackedPlot(page);

    // create a sinewave generator
    await createSineWaveGenerator(page);

    // click on stacked plot
    await page.locator('text=Open MCT My Items >> span').nth(3).click();
    await Promise.all([
        page.waitForNavigation(),
        page.locator('text=Unnamed Stacked Plot').first().click()
    ]);

    // create a second sinewave generator
    await createSineWaveGenerator(page);

    // click on stacked plot
    await page.locator('text=Open MCT My Items >> span').nth(3).click();
    await Promise.all([
        page.waitForNavigation(),
        page.locator('text=Unnamed Stacked Plot').first().click()
    ]);
}

async function saveStackedPlot(page) {
    // save stacked plot
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

async function createSineWaveGenerator(page) {
    //Create sine wave generator
    await page.locator('button.c-create-button').click();
    await page.locator('li:has-text("Sine Wave Generator")').click();

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle'}),
        page.locator('text=OK').click(),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
}
