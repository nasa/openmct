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
  Tests the visual appearance of the Time Conductor component
*/

import percySnapshot from '@percy/playwright';

import { test } from '../../../avpFixtures.js';
import { VISUAL_URL } from '../../../constants.js';

test.describe('Visual - Branding @a11y', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL in Realtime mode
    await page.goto(
      './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000',
      { waitUntil: 'domcontentloaded' }
    );
  });

  test('Visual - Time Conductor (Fixed time)', async ({ page, theme }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7623'
    });
    // Switch to fixed time at consistent bounds
    await page.goto(VISUAL_URL);
    // Take a snapshot of the Time Conductor
    await percySnapshot(page, `Time Conductor (Fixed time) (theme: '${theme}')`, {
      scope: '[aria-label="Global Time Conductor"]'
    });

    // Simulate window resize by changing viewport size
    await page.setViewportSize({
      width: 2048,
      height: 768
    });

    // Take a snapshot of the Time Conductor after resize
    await percySnapshot(page, `Time Conductor after resize (Fixed time) (theme: '${theme}')`, {
      scope: '[aria-label="Global Time Conductor"]'
    });
  });
});
