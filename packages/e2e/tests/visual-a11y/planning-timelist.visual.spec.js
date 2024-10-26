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
import fs from 'fs';

import { scanForA11yViolations, test } from '../../avpFixtures.js';
import {
  createTimelistWithPlanAndSetActivityInProgress,
  getFirstActivity
} from '../../helper/planningUtils.js';

const examplePlanSmall1 = JSON.parse(
  fs.readFileSync(new URL('../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url))
);

const FIRST_ACTIVITY_SMALL_1 = getFirstActivity(examplePlanSmall1);

test.describe('Visual - Timelist progress bar @clock @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: FIRST_ACTIVITY_SMALL_1.end + 10000 });
    await page.clock.resume();
    await createTimelistWithPlanAndSetActivityInProgress(page, examplePlanSmall1);
    await page.getByLabel('Click to collapse items').click();
  });

  test('progress pie is full', async ({ page, theme }) => {
    // Progress pie is completely full and doesn't update if now is greater than the end time
    await percySnapshot(page, `Time List with Activity in Progress (theme: ${theme})`);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  await scanForA11yViolations(page, testInfo.title);
});
