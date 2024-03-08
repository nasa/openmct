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
import { expect, test } from '../../../pluginFixtures.js';

const examplePlanSmall1 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);
test.describe('Time List', () => {
  test("Create a Time List, add a single Plan to it, verify all the activities are displayed with no milliseconds and selecting an activity shows it's properties", async ({
    page
  }) => {
    // Goto baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const timelist = await test.step('Create a Time List', async () => {
      const createdTimeList = await createDomainObjectWithDefaults(page, { type: 'Time List' });
      const objectName = await page.locator('.l-browse-bar__object-name').innerText();
      expect(objectName).toBe(createdTimeList.name);

      return createdTimeList;
    });

    await test.step('Create a Plan and add it to the timelist', async () => {
      await createPlanFromJSON(page, {
        name: 'Test Plan',
        json: examplePlanSmall1,
        parent: timelist.uuid
      });
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

      // Verify all events are displayed
      const eventCount = await page.getByRole('row').count();
      // subtracting one for the header
      await expect(eventCount - 1).toEqual(firstGroupItems.length);
    });

    await test.step('Does not show milliseconds in times', async () => {
      // Get an activity
      const row = page.getByRole('row').nth(2);
      // Verify that none fo the times have milliseconds displayed.
      // Example: 2024-11-17T16:00:00Z is correct and 2024-11-17T16:00:00.000Z is wrong

      await expect(row.locator('.--start')).not.toContainText('.');
      await expect(row.locator('.--end')).not.toContainText('.');
      await expect(row.locator('.--duration')).not.toContainText('.');
    });

    await test.step('Shows activity properties when a row is selected', async () => {
      await page.getByRole('row').nth(2).click();

      // Find the activity state section in the inspector
      await page.getByRole('tab', { name: 'Activity' }).click();
      // Check that activity state label is displayed in the inspector.
      await expect(page.getByLabel('Activity Status').locator("[aria-selected='true']")).toHaveText(
        'Not started'
      );
    });
  });
});

test("View a timelist in expanded view, verify all the activities are displayed and selecting an activity shows it's properties", async ({
  page
}) => {
  // Goto baseURL
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  const timelist = await test.step('Create a Time List', async () => {
    const createdTimeList = await createDomainObjectWithDefaults(page, { type: 'Time List' });
    const objectName = await page.locator('.l-browse-bar__object-name').innerText();
    expect(objectName).toBe(createdTimeList.name);

    return createdTimeList;
  });

  await test.step('Create a Plan and add it to the timelist', async () => {
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

    // Verify all events are displayed
    const eventCount = await page.getByRole('row').count();
    await expect(eventCount).toEqual(firstGroupItems.length);
  });

  await test.step('Shows activity properties when a row is selected in the expanded view', async () => {
    await page.getByRole('row').nth(2).click();

    // Find the activity state section in the inspector
    await page.getByRole('tab', { name: 'Activity' }).click();
    // Check that activity state label is displayed in the inspector.
    await expect(page.getByLabel('Activity Status').locator("[aria-selected='true']")).toHaveText(
      'Not started'
    );
  });

  await test.step("Verify absence of progress indication for an activity that's not in progress", async () => {
    // When an activity is not in progress, the progress pie is not visible
    const hidden = await page.getByRole('row').locator('path').nth(1).isHidden();
    await expect(hidden).toBe(true);
  });
});
