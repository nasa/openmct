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

import { expect, test } from '../../../avpFixtures.js';
import {
  MISSION_TIME,
  MISSION_TIME_FIXED_END,
  MISSION_TIME_FIXED_START,
  VISUAL_REALTIME_URL
} from '../../../constants.js';

test.describe('Visual - Time Conductor', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.pauseAt(MISSION_TIME);
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  // FIXME: checking for a11y violations times out. Might have something to do with the frozen clock.
  // test.afterEach(async ({ page }, testInfo) => {
  //   await scanForA11yViolations(page, testInfo.title);
  // });

  /**
   * FIXME: This test fails sporadically due to layout shift during initial load.
   * The layout shift seems to be caused by loading Open MCT's icons, which are not preloaded
   * and load after the initial DOM content has loaded.
   * @see https://github.com/nasa/openmct/issues/7775
   */
  test.fixme('Visual - Time Conductor (Fixed time) @clock @snapshot', async ({ page }) => {
    // Navigate to a specific view that uses the Time Conductor in Fixed Time mode with inspect and browse panes collapsed
    await page.goto(
      `./#/browse/mine?tc.mode=fixed&tc.startBound=${MISSION_TIME_FIXED_START}&tc.endBound=${MISSION_TIME_FIXED_END}&tc.timeSystem=utc&view=grid&hideInspector=true&hideTree=true`,
      {
        waitUntil: 'domcontentloaded'
      }
    );

    // Take a snapshot for comparison
    const snapshot = await page.screenshot({
      mask: []
    });
    expect(snapshot).toMatchSnapshot('time-conductor-fixed-time.png');
  });

  test('Visual - Time Conductor (Realtime) @clock @snapshot', async ({ page }) => {
    // Navigate to a specific view that uses the Time Conductor in Fixed Time mode with inspect and browse panes collapsed
    await page.goto(VISUAL_REALTIME_URL, {
      waitUntil: 'domcontentloaded'
    });

    const mask = [];

    // Take a snapshot for comparison
    const snapshot = await page.screenshot({
      mask
    });
    expect(snapshot).toMatchSnapshot('time-conductor-realtime.png');
  });
  test(
    'Visual - Time Conductor Axis Resized @clock @snapshot',
    { annotation: [{ type: 'issue', description: 'https://github.com/nasa/openmct/issues/7623' }] },
    async ({ page }) => {
      const VISUAL_REALTIME_WITH_PANES = VISUAL_REALTIME_URL.replace(
        'hideTree=true',
        'hideTree=false'
      ).replace('hideInspector=true', 'hideInspector=false');
      // Navigate to a specific view that uses the Time Conductor in Fixed Time mode with inspect
      await page.goto(VISUAL_REALTIME_WITH_PANES, {
        waitUntil: 'domcontentloaded'
      });

      // Set the time conductor to fixed time mode
      await page.getByLabel('Time Conductor Mode').click();
      await page.getByLabel('Time Conductor Mode Menu').click();
      await page.getByLabel('Fixed Timespan').click();
      await page.getByLabel('Submit time bounds').click();

      // Collapse the inspect and browse panes to trigger a resize of the conductor axis
      await page.getByLabel('Collapse Inspect Pane').click();
      await page.getByLabel('Collapse Browse Pane').click();

      // manually tick the clock to trigger the resize / re-render
      await page.clock.runFor(1000 * 2);

      const mask = [];

      // Take a snapshot for comparison
      const snapshot = await page.screenshot({
        mask
      });
      expect(snapshot).toMatchSnapshot('time-conductor-axis-resized.png');
    }
  );
});
