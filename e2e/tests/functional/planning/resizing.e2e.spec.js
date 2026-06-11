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
import fs from 'fs';

import { createPlanFromJSON, navigateToObjectWithFixedTimeBounds } from '../../../appActions.js';
import { setBoundsToSpanAllActivities } from '../../../helper/planningUtils.js';
import { expect, test } from '../../../pluginFixtures.js';

const testPlan = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);

test.describe('Resizing the window', () => {
  let plan;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    plan = await createPlanFromJSON(page, {
      json: testPlan
    });
  });

  test('will scale activities properly in the Plan View', async ({ page }) => {
    await setBoundsToSpanAllActivities(page, testPlan, plan.url);
    const activityCount = Object.values(testPlan).flat().length;
    const activities = page.locator('.c-plan__activity.activity-bounds');

    await expect(activities).toBeInViewport();
    await expect(activities).toHaveCount(activityCount);

    // drag the inspector handle to shrink the view size
    await page.getByLabel('Resize Inspect Pane').hover();
    await page.mouse.down();
    await page.mouse.move(-100, 0);
    await page.mouse.up();

    await expect(activities).toBeInViewport();
    await expect(activities).toHaveCount(activityCount);
  });
});
