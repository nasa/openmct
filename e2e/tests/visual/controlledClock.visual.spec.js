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
Collection of Visual Tests set to run in a default context. The tests within this suite
are only meant to run against openmct's app.js started by `npm run start` within the
`./e2e/playwright-visual.config.js` file.

These should only use functional expect statements to verify assumptions about the state
in a test and not for functional verification of correctness. Visual tests are not supposed
to "fail" on assertions. Instead, they should be used to detect changes between builds or branches.

Note: Larger testsuite sizes are OK due to the setup time associated with these tests.
*/

const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');
const path = require('path');
const sinon = require('sinon');

// Snippet from https://github.com/microsoft/playwright/issues/6347#issuecomment-965887758
// Will replace with cy.clock() equivalent
test.beforeEach(async ({ context }) => {
    await context.addInitScript({
        // eslint-disable-next-line no-undef
        path: path.join(__dirname, '../../..', './node_modules/sinon/pkg/sinon.js')
    });
    await context.addInitScript(() => {
        window.__clock = sinon.useFakeTimers({
            now: 0, //Set browser clock to UNIX Epoch
            shouldAdvanceTime: false, //Don't advance the clock
            toFake: ["setTimeout", "nextTick"]
        });
    });
});
test.use({ storageState: './e2e/test-data/VisualTestData_storage.json' });

test('Visual - Overlay Plot Loading Indicator @localstorage', async ({ page }) => {
    // Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.locator('a:has-text("Unnamed Overlay Plot Overlay Plot")').click();
    //Ensure that we're on the Unnamed Overlay Plot object
    await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Overlay Plot');

    //Wait for canvas to be rendered and stop animating
    await page.locator('canvas >> nth=1').hover({trial: true});

    //Take snapshot of Sine Wave Generator within Overlay Plot
    await percySnapshot(page, 'SineWaveInOverlayPlot');
});
