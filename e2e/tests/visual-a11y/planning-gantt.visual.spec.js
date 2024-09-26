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
import { scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_FIXED_URL } from '../../constants.js';
import { setBoundsToSpanAllActivities, setDraftStatusForPlan } from '../../helper/planningUtils.js';

const examplePlanSmall2 = JSON.parse(
  fs.readFileSync(new URL('../../test-data/examplePlans/ExamplePlan_Small2.json', import.meta.url))
);

test.describe('Visual - Gantt Chart @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });
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

    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });

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

test.afterEach(async ({ page }, testInfo) => {
  await scanForA11yViolations(page, testInfo.title);
});
