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
 * This test suite is dedicated to testing the rendering and interaction of plots.
 *
 */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Plot Integrity Testing @unstable', () => {
    let sineWaveGeneratorObject;

    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        sineWaveGeneratorObject = await createDomainObjectWithDefaults(page, {
            type: 'Sine Wave Generator'
        });
    });

    test('Plots do not re-request data when a plot is clicked', async ({
        page
    }) => {
        //Navigate to Sine Wave Generator
        await page.goto(sineWaveGeneratorObject.url);
        //Click on the plot canvas
        await page.locator('canvas').nth(1).click();
        //No request was made to get historical data
        const createMineFolderRequests = [];
        page.on('request', (req) => {
            // eslint-disable-next-line playwright/no-conditional-in-test
            createMineFolderRequests.push(req);
        });
        expect(createMineFolderRequests.length).toEqual(0);
    });

    test('Plot is rendered when infinity values exist', async ({ page }) => {
        // Edit Plot
        await editSineWaveToUseInfinityOption(page, sineWaveGeneratorObject);

        //Get pixel data from Canvas
        const plotPixelSize = await getCanvasPixelsWithData(page);
        expect(plotPixelSize).toBeGreaterThan(0);
    });
});

/**
 * This function edits a sine wave generator with the default options and enables the infinity values option.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../../appActions').CreateObjectInfo} sineWaveGeneratorObject
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the edited domain object.
 */
async function editSineWaveToUseInfinityOption(page, sineWaveGeneratorObject) {
    await page.goto(sineWaveGeneratorObject.url);
    // Edit LAD table
    await page.locator('[title="More options"]').click();
    await page.locator('[title="Edit properties of this object."]').click();
    // Modify the infinity option to true
    const infinityInput = page.locator(
        '[aria-label="Include Infinity Values"]'
    );
    await infinityInput.click();

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // FIXME: Changes to SWG properties should be reflected on save, but they're not?
    // Thus, navigate away and back to the object.
    await page.goto('./#/browse/mine');
    await page.goto(sineWaveGeneratorObject.url);

    await page
        .locator('c-progress-bar c-telemetry-table__progress-bar')
        .waitFor({
            state: 'hidden'
        });

    // FIXME: The progress bar disappears on series data load, not on plot render,
    // so wait for a half a second before evaluating the canvas.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getCanvasPixelsWithData(page) {
    const getTelemValuePromise = new Promise((resolve) =>
        page.exposeFunction('getCanvasValue', resolve)
    );

    await page.evaluate(() => {
        // The document canvas is where the plot points and lines are drawn.
        // The only way to access the canvas is using document (using page.evaluate)
        let data;
        let canvas;
        let ctx;
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext('2d');
        data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const imageDataValues = Object.values(data);
        let plotPixels = [];
        // Each pixel consists of four values within the ImageData.data array. The for loop iterates by multiples of four.
        // The values associated with each pixel are R (red), G (green), B (blue), and A (alpha), in that order.
        for (let i = 0; i < imageDataValues.length; ) {
            if (imageDataValues[i] > 0) {
                plotPixels.push({
                    startIndex: i,
                    endIndex: i + 3,
                    value: `rgb(${imageDataValues[i]}, ${
                        imageDataValues[i + 1]
                    }, ${imageDataValues[i + 2]}, ${imageDataValues[i + 3]})`
                });
            }

            i = i + 4;
        }

        window.getCanvasValue(plotPixels.length);
    });

    return getTelemValuePromise;
}
