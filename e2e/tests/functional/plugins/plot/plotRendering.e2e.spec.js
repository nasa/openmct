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

const { test } = require('../../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Plot Integrity Testing @unstable', () => {
    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        await createDomainObjectWithDefaults(page, { type: 'Sine Wave Generator' });
        //Edit Existing SWG to add randomness
    });

    test('Plots do not re-render when clicking clicking into plot', async ({ page }) => {
        //Navigate to Sine Wave Generator with Randomness
        //Capture the number of plots points and store as const name numberOfPlotPoints
        //Click into center of SWG
        //Capture the number of plot points and check against first value of numberOfPlotPoints
    });

    test('Plots re-request data when resizing at the appropriate threshold', async ({ page }) => {
        //Navigate to Sine Wave Generator with Randomness
        //Capture the number of plots points and store as const name numberOfPlotPoints
        //Move the Inspector window by 1 pixel
        //Capture the number of plot points and check against first value of numberOfPlotPoints
        //Collpase the Inspector window
        //Capture the number of plot points and ensure that plot has re-requested data
    });
});

test.describe('Plot Integrity Testing within Display Layout @unstable', () => {
    test.beforeEach(async ({ page }) => {
        //Open a browser, navigate to the main page, and wait until all networkevents to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
        await createDomainObjectWithDefaults(page, { type: 'Sine Wave Generator' });
        //Edit Existing SWG to add randomness
        //Create Display Layout
        //Link SWG to Display Layout
    });

    test.fixme('Plots do not re-render when clicking clicking into plot', async ({ page }) => {
        //Navigate to Sine Wave Generator with Randomness
        //Capture the number of plots points and store as const name numberOfPlotPoints
        //Click into center of SWG
        //Capture the number of plot points and check against first value of numberOfPlotPoints
    });

    test.fixme('Plots re-request data when resizing at the appropriate threshold', async ({ page }) => {
        //Navigate to Sine Wave Generator with Randomness
        //Capture the number of plots points and store as const name numberOfPlotPoints
        //Move the Inspector window by 1 pixel
        //Capture the number of plot points and check against first value of numberOfPlotPoints
        //Collpase the Inspector window
        //Capture the number of plot points and ensure that plot has re-requested data
    });
});
