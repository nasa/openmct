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
        sineWaveGeneratorObject = await createDomainObjectWithDefaults(page, { type: 'Sine Wave Generator' });
    });

    test('Plots do not re-request data when a plot is clicked', async ({ page }) => {
        //Navigate to Sine Wave Generator
        await page.goto(sineWaveGeneratorObject.url);
        //Capture the number of plots points and store as const name numberOfPlotPoints
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
});
