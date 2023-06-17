/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
const { test, expect } = require('../../../pluginFixtures');
const {
  createPlanFromJSON,
  createDomainObjectWithDefaults,
  selectInspectorTab
} = require('../../../appActions');
const testPlan1 = require('../../../test-data/examplePlans/ExamplePlan_Small1.json');
const testPlan2 = require('../../../test-data/examplePlans/ExamplePlan_Small2.json');
const {
  assertPlanActivities,
  setBoundsToSpanAllActivities
} = require('../../../helper/planningUtils');
const { getPreciseDuration } = require('../../../../src/utils/duration');

test.describe('Gantt Chart', () => {
  let ganttChart;
  let plan;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart'
    });
    plan = await createPlanFromJSON(page, {
      json: testPlan1,
      parent: ganttChart.uuid
    });
  });

  test('Displays all plan events', async ({ page }) => {
    await page.goto(ganttChart.url);

    await assertPlanActivities(page, testPlan1, ganttChart.url);
  });
  test('Replaces a plan with a new plan', async ({ page }) => {
    await assertPlanActivities(page, testPlan1, ganttChart.url);
    await createPlanFromJSON(page, {
      json: testPlan2,
      parent: ganttChart.uuid
    });
    const replaceModal = page
      .getByRole('dialog')
      .filter({ hasText: 'This action will replace the current Plan. Do you want to continue?' });
    await expect(replaceModal).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();

    await assertPlanActivities(page, testPlan2, ganttChart.url);
  });
  test('Can select a single activity and display its details in the inspector', async ({
    page
  }) => {
    test.slow();
    await page.goto(ganttChart.url);

    await setBoundsToSpanAllActivities(page, testPlan1, ganttChart.url);

    const activities = Object.values(testPlan1).flat();
    const activity = activities[0];
    await page
      .locator('g')
      .filter({ hasText: new RegExp(activity.name) })
      .click();
    await selectInspectorTab(page, 'Activity');

    const startDateTime = await page
      .locator(
        '.c-inspect-properties__label:has-text("Start DateTime")+.c-inspect-properties__value'
      )
      .innerText();
    const endDateTime = await page
      .locator('.c-inspect-properties__label:has-text("End DateTime")+.c-inspect-properties__value')
      .innerText();
    const duration = await page
      .locator('.c-inspect-properties__label:has-text("duration")+.c-inspect-properties__value')
      .innerText();

    const expectedStartDate = new Date(activity.start).toISOString();
    const actualStartDate = new Date(startDateTime).toISOString();
    const expectedEndDate = new Date(activity.end).toISOString();
    const actualEndDate = new Date(endDateTime).toISOString();
    const expectedDuration = getPreciseDuration(activity.end - activity.start);
    const actualDuration = duration;

    expect(expectedStartDate).toEqual(actualStartDate);
    expect(expectedEndDate).toEqual(actualEndDate);
    expect(expectedDuration).toEqual(actualDuration);
  });
  test("Displays a Plan's draft status", async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6641'
    });

    // Mark the Plan's status as draft in the OpenMCT API
    await page.evaluate(async (planObject) => {
      await window.openmct.status.set(planObject.uuid, 'draft');
    }, plan);

    // Navigate to the Gantt Chart
    await page.goto(ganttChart.url);

    // Assert that the Plan's status is displayed as draft
    expect(await page.locator('.u-contents.c-swimlane.is-status--draft').count()).toBe(
      Object.keys(testPlan1).length
    );
  });
});
