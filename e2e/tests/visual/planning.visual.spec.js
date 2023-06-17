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

const { test } = require('../../pluginFixtures');
const { setBoundsToSpanAllActivities } = require('../../helper/planningUtils');
const { createDomainObjectWithDefaults, createPlanFromJSON } = require('../../appActions');
const percySnapshot = require('@percy/playwright');
const examplePlanSmall = require('../../test-data/examplePlans/ExamplePlan_Small2.json');

const snapshotScope = '.l-shell__pane-main .l-pane__contents';

test.describe('Visual - Planning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Plan View', async ({ page, theme }) => {
    const plan = await createPlanFromJSON(page, {
      name: 'Plan Visual Test',
      json: examplePlanSmall
    });

    await setBoundsToSpanAllActivities(page, examplePlanSmall, plan.url);
    await percySnapshot(page, `Plan View (theme: ${theme})`, {
      scope: snapshotScope
    });
  });

  test('Plan View w/ draft status', async ({ page, theme }) => {
    const plan = await createPlanFromJSON(page, {
      name: 'Plan Visual Test (Draft)',
      json: examplePlanSmall
    });
    await page.goto('./#/browse/mine');

    await setDraftStatusForPlan(page, plan);

    await setBoundsToSpanAllActivities(page, examplePlanSmall, plan.url);
    await percySnapshot(page, `Plan View w/ draft status (theme: ${theme})`, {
      scope: snapshotScope
    });
  });

  test('Gantt Chart View', async ({ page, theme }) => {
    const ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart',
      name: 'Gantt Chart Visual Test'
    });
    await createPlanFromJSON(page, {
      json: examplePlanSmall,
      parent: ganttChart.uuid
    });
    await setBoundsToSpanAllActivities(page, examplePlanSmall, ganttChart.url);
    await percySnapshot(page, `Gantt Chart View (theme: ${theme})`, {
      scope: snapshotScope
    });
  });

  test('Gantt Chart View w/ draft status', async ({ page, theme }) => {
    const ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart',
      name: 'Gantt Chart Visual Test (Draft)'
    });
    const plan = await createPlanFromJSON(page, {
      json: examplePlanSmall,
      parent: ganttChart.uuid
    });

    await setDraftStatusForPlan(page, plan);

    await page.goto('./#/browse/mine');

    await setBoundsToSpanAllActivities(page, examplePlanSmall, ganttChart.url);
    await percySnapshot(page, `Gantt Chart View w/ draft status (theme: ${theme})`, {
      scope: snapshotScope
    });
  });
});

/**
 * Uses the Open MCT API to set the status of a plan to 'draft'.
 * @param {import('@playwright/test').Page} page
 * @param {import('../../appActions').CreatedObjectInfo} plan
 */
async function setDraftStatusForPlan(page, plan) {
  await page.evaluate(async (planObject) => {
    await window.openmct.status.set(planObject.uuid, 'draft');
  }, plan);
}
