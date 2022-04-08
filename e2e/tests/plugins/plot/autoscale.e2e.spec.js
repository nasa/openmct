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
Test for plot autoscale.
*/

const { test, expect } = require('@playwright/test');

test.use({
    viewport: {
        width: 1280,
        height: 720
    }
});

test.describe('ExportAsJSON', () => {
    test.only('autoscale off causes no error from undefined user range', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });

        expect(true).toBe(true);

        await createSinewaveOverlayPlot(page);

        await testTicks(page, ['-10', '-5', '0', '5', '10']);
        // TODO, snapshot testing not working, https://github.com/microsoft/playwright/issues/13414
        // await Promise.all([
        //     testTicks(page, ['-10', '-5', '0', '5', '10']),
        //     page.screenshot().then((shot) => expect(shot).toMatchSnapshot('autoscale-canvas-prepan'))
        // ]);

        const canvas = await page.locator('canvas').nth(1);

        let errorCount = 0;

        function onError() {
            errorCount++;
        }

        page.on('pageerror', onError);

        await page.keyboard.down('Alt');

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

        await page.keyboard.up('Alt');

        page.off('pageerror', onError);

        // No error means the bug was fixed.
        expect(errorCount).toBe(0);

        await testTicks(page, ['0', '5', '10', '15']);
        // TODO, snapshot testing not working, https://github.com/microsoft/playwright/issues/13414
        // await Promise.all([
        //     testTicks(page, ['0', '5', '10', '15']),
        //     page.screenshot().then((shot) => expect(shot).toMatchSnapshot('autoscale-canvas-panned'))
        // ]);
    });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function createSinewaveOverlayPlot(page) {
    // click create button
    await page.locator('button:has-text("Create")').click();

    // add overlay plot with defaults
    await page.locator('li:has-text("Overlay Plot")').click();
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/a9268c6f-45cc-4bcd-a6a0-50ac4036e396?tc.mode=fixed&tc.startBound=1649305424163&tc.endBound=1649307224163&tc.timeSystem=utc&view=plot-overlay' }*/),
        page.locator('text=OK').click()
    ]);

    // save (exit edit mode)
    await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
    await page.locator('text=Save and Finish Editing').click();

    // click create button
    await page.locator('button:has-text("Create")').click();

    // add sine wave generator with defaults
    await page.locator('li:has-text("Sine Wave Generator")').click();
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/a9268c6f-45cc-4bcd-a6a0-50ac4036e396/5cfa5c69-17bc-4a99-9545-4da8125380c5?tc.mode=fixed&tc.startBound=1649305424163&tc.endBound=1649307224163&tc.timeSystem=utc&view=plot-single' }*/),
        page.locator('text=OK').click()
    ]);

    // focus the overlay plot
    await page.locator('text=Open MCT My Items >> span').nth(3).click();
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/a9268c6f-45cc-4bcd-a6a0-50ac4036e396?tc.mode=fixed&tc.startBound=1649305424163&tc.endBound=1649307224163&tc.timeSystem=utc&view=plot-overlay' }*/),
        page.locator('text=Unnamed Overlay Plot').first().click()
    ]);

    // enter edit mode
    await page.locator('text=Unnamed Overlay Plot Snapshot >> button').nth(3).click();

    // uncheck autoscale
    await page.locator('text=Y Axis Scaling Auto scale Padding >> input[type="checkbox"]').uncheck();

    // save
    await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
    await page.locator('text=Save and Finish Editing').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function testTicks(page, values) {
    const yTicks = page.locator('.gl-plot-y-tick-label');
    let promises = [yTicks.count().then((c) => expect(c).toBe(values.length))];

    for (let i = 0, l = values.length; i < l; i += 1) {
        promises.push(expect(yTicks.nth(i)).toHaveText(values[i])); // eslint-disable-line
    }

    await Promise.all(promises);
}
