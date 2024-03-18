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

import { createPlanFromJSON } from '../../../appActions.js';
import {
  addPlanGetInterceptor,
  assertPlanActivities,
  assertPlanOrderedSwimLanes
} from '../../../helper/planningUtils.js';
import { expect, test } from '../../../pluginFixtures.js';

const testPlan1 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);

const testPlanWithOrderedLanes = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlanWithOrderedLanes.json', import.meta.url)
  )
);

test.describe('Plan', () => {
  let plan;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    plan = await createPlanFromJSON(page, {
      json: testPlan1
    });
  });

  test('Displays all plan events', async ({ page }) => {
    await assertPlanActivities(page, testPlan1, plan.url);
  });

  test('Displays plans with ordered swim lanes configuration', async ({ page }) => {
    // Add configuration for swim lanes
    await addPlanGetInterceptor(page);
    // Create the plan
    const planWithSwimLanes = await createPlanFromJSON(page, {
      json: testPlanWithOrderedLanes
    });
    await assertPlanOrderedSwimLanes(page, testPlanWithOrderedLanes, planWithSwimLanes.url);
  });

  test('Allows setting the state of an activity when selected.', async ({ page }) => {
    const groups = Object.keys(testPlan1);
    const firstGroupKey = groups[0];
    const firstGroupItems = testPlan1[firstGroupKey];
    const firstActivity = firstGroupItems[0];
    const lastActivity = firstGroupItems[firstGroupItems.length - 1];
    const startBound = firstActivity.start;
    // Set the endBound to the end time of the current activity
    let endBound = lastActivity.end;
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (endBound === startBound) {
      // Prevent oddities with setting start and end bound equal
      // via URL params
      endBound += 1;
    }

    // Switch to fixed time mode with all plan events within the bounds
    await page.goto(
      `${plan.url}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=plan.view`
    );

    // select the first activity in the list
    await page.getByText('Past event 1').click();

    // Find the activity state section in the inspector
    await page.getByRole('tab', { name: 'Activity' }).click();

    // Check that activity state dropdown selection shows the `set status` option by default
    await expect(page.getByLabel('Activity Status').locator("[aria-selected='true']")).toHaveText(
      'Not started'
    );

    // Change the selection of the activity status
    await page.getByRole('combobox').selectOption({ label: 'Aborted' });
    // select a different activity and back to the previous one
    await page.getByText('Past event 2').click();
    await page.getByText('Past event 1').click();
    // Check that activity state dropdown selection shows the previously selected option by default
    await expect(page.getByLabel('Activity Status').locator("[aria-selected='true']")).toHaveText(
      'Aborted'
    );
  });
});
