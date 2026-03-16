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

import percySnapshot from '@percy/playwright';

import { createStableStateTelemetry } from '../../appActions.js';
import { VISUAL_REALTIME_URL } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Visual - Plot rendering with out of order data', () => {
  let telemetry;

  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_REALTIME_URL, { waitUntil: 'domcontentloaded' });

    // Create State generator with out of order set to TRUE to test telemetry table with out of order data
    telemetry = await createStableStateTelemetry(page, 'mine', true);
  });
  test('Out of Order Plot Paused', async ({ page, theme }) => {
    await page.goto(telemetry.url, { waitUntil: 'domcontentloaded' });

    // hover over plot for plot controls
    await page.getByLabel('Plot Canvas').hover();
    // click on pause control
    await page.getByTitle('Pause incoming real-time data').click();

    // there should be no out of order data in the plot. This is verified by checking that the out of order y-axis label is not present in the plot. If the out of order data is present, the y-axis label will be present in the plot.
    await expect(page.getByText('OUT OF ORDER')).toHaveCount(0);

    await percySnapshot(page, `Out of Order Plot Paused (theme: ${theme})`);
  });
});
