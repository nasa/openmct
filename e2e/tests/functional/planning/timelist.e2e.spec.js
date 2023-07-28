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
const { createDomainObjectWithDefaults, createPlanFromJSON } = require('../../../appActions');

const testPlan = {
  TEST_GROUP: [
    {
      name: 'Past event 1',
      start: 1660320408000,
      end: 1660343797000,
      type: 'TEST-GROUP',
      color: 'orange',
      textColor: 'white'
    },
    {
      name: 'Past event 2',
      start: 1660406808000,
      end: 1660429160000,
      type: 'TEST-GROUP',
      color: 'orange',
      textColor: 'white'
    },
    {
      name: 'Past event 3',
      start: 1660493208000,
      end: 1660503981000,
      type: 'TEST-GROUP',
      color: 'orange',
      textColor: 'white'
    },
    {
      name: 'Past event 4',
      start: 1660579608000,
      end: 1660624108000,
      type: 'TEST-GROUP',
      color: 'orange',
      textColor: 'white'
    },
    {
      name: 'Past event 5',
      start: 1660666008000,
      end: 1660681529000,
      type: 'TEST-GROUP',
      color: 'orange',
      textColor: 'white'
    }
  ]
};

test.describe('Time List', () => {
  test('Create a Time List, add a single Plan to it and verify all the activities are displayed with no milliseconds', async ({
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
      const createdPlan = await createPlanFromJSON(page, {
        name: 'Test Plan',
        json: testPlan
      });

      await page.goto(timelist.url);
      // Expand the tree to show the plan
      await page.click("button[title='Show selected item in tree']");
      await page.dragAndDrop(`role=treeitem[name=/${createdPlan.name}/]`, '.c-object-view');
      await page.click("button[title='Save']");
      await page.click("li[title='Save and Finish Editing']");
      const startBound = testPlan.TEST_GROUP[0].start;
      const endBound = testPlan.TEST_GROUP[testPlan.TEST_GROUP.length - 1].end;

      await page.goto(timelist.url);

      // Switch to fixed time mode with all plan events within the bounds
      await page.goto(
        `${timelist.url}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=timelist.view`
      );

      // Verify all events are displayed
      const eventCount = await page.locator('.js-list-item').count();
      expect(eventCount).toEqual(testPlan.TEST_GROUP.length);
    });

    await test.step('Does not show milliseconds in times', async () => {
      // Get the first activity
      const row = page.locator('.js-list-item').first();
      // Verify that none fo the times have milliseconds displayed.
      // Example: 2024-11-17T16:00:00Z is correct and 2024-11-17T16:00:00.000Z is wrong

      await expect(row.locator('.--start')).not.toContainText('.');
      await expect(row.locator('.--end')).not.toContainText('.');
      await expect(row.locator('.--duration')).not.toContainText('.');
    });
  });
});
