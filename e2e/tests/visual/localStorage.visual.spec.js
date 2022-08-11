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
Collection of Visual Tests which leverage the .json file.
*/
const { test, expect } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');
test.describe('Visual - localStorage execution @localStorage', () => {
    test.use({
        storageState: './e2e/test-data/overlay_plot_with_delay_storage.json'
    });
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
    });

    test('Visual - Overlay Plot Loading Indicator @localStorage', async ({ page, theme }) => {
        // Click on Overlay Plot which was generated in localStorage
        await page.locator('a:has-text("Unnamed Overlay Plot Overlay Plot")').click();
        //Ensure that we're on the Unnamed Overlay Plot object
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Overlay Plot');

        //Wait for canvas to be rendered and stop animating
        await page.locator('canvas >> nth=1').hover({trial: true});

        await percySnapshot(page, `SineWaveInOverlayPlot (theme: '${theme}')`);

        // //TODO Figure out how to freeze animation
        // await page.screenshot({animations: 'disabled'});
        // await percySnapshot(page, `SineWaveInOverlayPlot (theme: '${theme}') frozen`);
    });
});
