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
const { createDomainObjectWithDefaults, createSineWaveWithInfinityOption} = require('../../../../appActions');

test.describe('Plot Integrity Testing @unstable', () => {
    let sineWaveGeneratorObject;

    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        sineWaveGeneratorObject = await createDomainObjectWithDefaults(page, { type: 'Sine Wave Generator' });
    });

    test('Plots do not re-request data when a plot is clicked', async ({ page }) => {
        //Navigate to Sine Wave Generator
        await page.goto(sineWaveGeneratorObject.url);
        //Click on the plot canvas
        await page.locator('canvas').nth(1).click();
        //No request was made to get historical data
        const createMineFolderRequests = [];
        page.on('request', req => {
            // eslint-disable-next-line playwright/no-conditional-in-test
            createMineFolderRequests.push(req);
        });
        expect(createMineFolderRequests.length).toEqual(0);
    });

    test('Plot is rendered when infinity values exist', async ({ page }) => {
        // Create Plot
        const sineObject = await createSineWaveWithInfinityOption(page, { type: 'Sine Wave Generator' });

        //Navigate to Sine Wave Generator
        await page.goto(sineObject.url);
        //Get pixel data from Canvas
        const plotPixels = await getCanvasPixelsWithData(page);
        expect(plotPixels.length).toBeGreaterThan(0);
    });
});

async function getCanvasPixelsWithData(page) {
    const getTelemValuePromise = new Promise(resolve => page.exposeFunction('getCanvasValue', resolve));

    await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const imageDataValues = Object.values(data);
        let plotPixels = [];
        // Each pixel consists of four values within the ImageData.data array. The for loop iterates by multiples of four.
        // The values associated with each pixel are R (red), G (green), B (blue), and A (alpha), in that order.
        for (let i = 0; i < imageDataValues.length;) {
            if (imageDataValues[i] > 0) {
                plotPixels.push({
                    startIndex: i,
                    endIndex: i + 3,
                    value: `rgb(${imageDataValues[i]}, ${imageDataValues[i + 1]}, ${imageDataValues[i + 2]}, ${imageDataValues[i + 3]})`
                });
            }

            i = i + 4;

        }

        console.log(plotPixels.length);

        window.getCanvasValue(plotPixels);
    });

    return getTelemValuePromise;
}
