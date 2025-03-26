/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
Collection of Visual Tests set to run with browser clock manipulate made possible with the
clockOptions plugin fixture.
*/

import percySnapshot from '@percy/playwright';

import { MISSION_TIME, VISUAL_FIXED_URL } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Visual - Controlled Clock @clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });
  });
  test.use({
    storageState: 'test-data/overlay_plot_with_delay_storage.json'
  });

  test('Overlay Plot Loading Indicator @localStorage', async ({ page, theme }) => {
    await page
      .getByRole('gridcell', { hasText: 'Overlay Plot with 5s Delay Overlay Plot' })
      .click();
    //Ensure that we're on the Unnamed Overlay Plot object
    await expect(page.getByRole('main')).toContainText('Overlay Plot with 5s Delay');

    //Wait for canvas to be rendered and stop animating, but plot should not be loaded.
    //Cannot use waitForPlotsToRender due to clockOptions.
    await page.locator('#webglContext').hover({ trial: true });

    //Take snapshot of Sine Wave Generator within Overlay Plot
    await percySnapshot(page, `SineWaveInOverlayPlot (theme: '${theme}')`);
  });
});
