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
  test.use({
    clockOptions: {
      now: MISSION_TIME,
      shouldAdvanceTime: false
    }
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test(
    'Visual - Time Conductor (Fixed time) @a11y @clock @snapshot',
    { annotation: [{ type: 'issue', description: 'https://github.com/nasa/openmct/issues/7623' }] },
    async ({ page }) => {
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
    }
  );

  test(
    'Visual - Time Conductor (Realtime) @a11y @clock @snapshot',
    { annotation: [{ type: 'issue', description: 'https://github.com/nasa/openmct/issues/7623' }] },
    async ({ page }) => {
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
    }
  );
});