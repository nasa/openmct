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

import { createDomainObjectWithDefaults, createPlanFromJSON } from '../../appActions.js';
import { test } from '../../avpFixtures.js';
import { VISUAL_URL } from '../../constants.js';
import { setBoundsToSpanAllActivities, setDraftStatusForPlan } from '../../helper/planningUtils.js';

const examplePlanSmall1 = JSON.parse(
  fs.readFileSync(new URL('../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url))
);

const examplePlanSmall2 = JSON.parse(
  fs.readFileSync(new URL('../../test-data/examplePlans/ExamplePlan_Small2.json', import.meta.url))
);

test.describe('Visual - Planning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Plan View', async ({ page, theme }) => {
    const plan = await createPlanFromJSON(page, {
      name: 'Plan Visual Test',
      json: examplePlanSmall2
    });

    await setBoundsToSpanAllActivities(page, examplePlanSmall2, plan.url);
    await percySnapshot(page, `Plan View (theme: ${theme})`);
  });

  test('Plan View w/ draft status', async ({ page, theme }) => {
    const plan = await createPlanFromJSON(page, {
      name: 'Plan Visual Test (Draft)',
      json: examplePlanSmall2
    });
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
    await setDraftStatusForPlan(page, plan);

    await setBoundsToSpanAllActivities(page, examplePlanSmall2, plan.url);
    await percySnapshot(page, `Plan View w/ draft status (theme: ${theme})`);
  });
});

test.describe('Visual - Gantt Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });
  test('Gantt Chart View', async ({ page, theme }) => {
    const ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart',
      name: 'Gantt Chart Visual Test'
    });
    await createPlanFromJSON(page, {
      json: examplePlanSmall2,
      parent: ganttChart.uuid
    });
    await setBoundsToSpanAllActivities(page, examplePlanSmall2, ganttChart.url);
    await percySnapshot(page, `Gantt Chart View (theme: ${theme}) - Clipped Activity Names`);

    // Expand the inspect pane and uncheck the 'Clip Activity Names' option
    await page.getByRole('button', { name: 'Expand Inspect Pane' }).click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Clip Activity Names').click();

    // Close the inspect pane and save the changes
    await page.getByRole('button', { name: 'Collapse Inspect Pane' }).click();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Dismiss the notification
    await page.getByLabel('Dismiss').click();

    await percySnapshot(page, `Gantt Chart View (theme: ${theme}) - Unclipped Activity Names`);
  });

  test('Gantt Chart View w/ draft status', async ({ page, theme }) => {
    const ganttChart = await createDomainObjectWithDefaults(page, {
      type: 'Gantt Chart',
      name: 'Gantt Chart Visual Test (Draft)'
    });
    const plan = await createPlanFromJSON(page, {
      json: examplePlanSmall2,
      parent: ganttChart.uuid
    });

    await setDraftStatusForPlan(page, plan);

    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });

    await setBoundsToSpanAllActivities(page, examplePlanSmall2, ganttChart.url);
    await percySnapshot(page, `Gantt Chart View w/ draft status (theme: ${theme})`);

    // Expand the inspect pane and uncheck the 'Clip Activity Names' option
    await page.getByRole('button', { name: 'Expand Inspect Pane' }).click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Clip Activity Names').click();

    // Close the inspect pane and save the changes
    await page.getByRole('button', { name: 'Collapse Inspect Pane' }).click();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Dismiss the notification
    await page.getByLabel('Dismiss').click();

    await percySnapshot(
      page,
      `Gantt Chart View w/ draft status (theme: ${theme}) - Unclipped Activity Names`
    );
  });
});

let timelist;
test.describe('Visual - Timelist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
    timelist = await createDomainObjectWithDefaults(page, {
      type: 'Time List',
      name: 'Time List Visual Test'
    });
  });
  test('View a timelist in expanded view', async ({ page }) => {
    await createPlanFromJSON(page, {
      name: 'Test Plan',
      json: examplePlanSmall1,
      parent: timelist.uuid
    });

    // Ensure that all activities are shown in the expanded view
    const groups = Object.keys(examplePlanSmall1);
    const firstGroupKey = groups[0];
    const firstGroupItems = examplePlanSmall1[firstGroupKey];
    const firstActivity = firstGroupItems[0];
    const lastActivity = firstGroupItems[firstGroupItems.length - 1];
    const startBound = firstActivity.start;
    const endBound = lastActivity.end;

    // Switch to fixed time mode with all plan events within the bounds
    await page.goto(
      `${timelist.url}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=timelist.view`
    );

    // Change the object to edit mode
    await page.getByRole('button', { name: 'Edit Object' }).click();

    // Find the display properties section in the inspector
    await page.getByRole('tab', { name: 'View Properties' }).click();
    // Switch to expanded view and save the setting
    await page.getByLabel('Display Style').selectOption({ label: 'Expanded' });

    // Click on the "Save" button
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.getByRole('row').nth(2).click();

    // Find the activity state section in the inspector
    await page.getByRole('tab', { name: 'Activity' }).click();
  });
});

// Skipping for https://github.com/nasa/openmct/issues/7421
// test.afterEach(async ({ page }, testInfo) => {
//   await scanForA11yViolations(page, testInfo.title);
// });
