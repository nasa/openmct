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

import { createDomainObjectWithDefaults, createPlanFromJSON } from '../../../appActions.js';
import { setBoundsToSpanAllActivities } from '../../../helper/planningUtils.js';
import { expect, test } from '../../../pluginFixtures.js';

const testPlan = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);

test.describe('Resizing the window', () => {
  let activities;
  let activitiesCount;
  let timeAxisScale;
  let resizeHandle;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    activities = page.locator('.c-plan__activity.activity-bounds');
    activitiesCount = Object.values(testPlan).flat().length;
    timeAxisScale = page.locator('.c-swimlane__time-axis').locator('.c-swimlane__lane-object');
    resizeHandle = page.getByLabel('Resize Inspect Pane');
  });

  test('will scale activities properly in the Plan View', async ({ page }) => {
    const plan = await createPlanFromJSON(page, {
      json: testPlan
    });
    await setBoundsToSpanAllActivities(page, testPlan, plan.url);

    await test.step('all activities are in viewport', async () => {
      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });

    await test.step('shrink viewport and all activities should still fit in timespan', async () => {
      const { width } = await timeAxisScale.boundingBox();
      const { x, y } = await resizeHandle.boundingBox();

      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(x - width + 15, y);
      await page.mouse.up();

      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });
  });

  test('will scale activities properly in the Gantt View', async ({ page }) => {
    const ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart'
    });
    const plan = await createPlanFromJSON(page, {
      json: testPlan,
      parent: ganttChart.uuid
    });
    await setBoundsToSpanAllActivities(page, testPlan, plan.url);

    await test.step('all activities are in viewport', async () => {
      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });

    await test.step('shrink viewport and all activities should still fit in timespan', async () => {
      const { width } = await timeAxisScale.boundingBox();
      const { x, y } = await resizeHandle.boundingBox();

      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(x - width + 15, y);
      await page.mouse.up();

      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });
  });

  test('will scale activities properly in the Time Strip View', async ({ page }) => {
    const timeStrip = await createDomainObjectWithDefaults(page, { type: 'Time Strip' });
    const plan = await createPlanFromJSON(page, {
      json: testPlan,
      parent: timeStrip.uuid
    });
    await setBoundsToSpanAllActivities(page, testPlan, plan.url);

    await test.step('all activities are in viewport', async () => {
      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });

    await test.step('shrink viewport and all activities should still fit in timespan', async () => {
      const { width } = await timeAxisScale.boundingBox();
      const { x, y } = await resizeHandle.boundingBox();

      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(x - width + 15, y);
      await page.mouse.up();

      await expect(activities).toHaveCount(activitiesCount);
      for (const activity of await activities.all()) {
        await expect(activity).toBeInViewport();
      }
    });
  });
});
