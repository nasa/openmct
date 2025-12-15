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

import {
  createDomainObjectWithDefaults,
  createPlanFromJSON,
  navigateToObjectWithFixedTimeBounds,
  setFixedIndependentTimeConductorBounds,
  setFixedTimeMode,
  setTimeConductorBounds
} from '../../../appActions.js';
import { expect, test } from '../../../pluginFixtures.js';

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

test.describe('Time Strip', () => {
  let timestrip;
  let plan;

  test.beforeEach(async ({ page }) => {
    // Goto baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    timestrip = await test.step('Create a Time Strip', async () => {
      const createdTimeStrip = await createDomainObjectWithDefaults(page, { type: 'Time Strip' });
      const objectName = await page.locator('.l-browse-bar__object-name').innerText();
      expect(objectName).toBe(createdTimeStrip.name);

      return createdTimeStrip;
    });

    plan = await test.step('Create a Plan and add it to the timestrip', async () => {
      const createdPlan = await createPlanFromJSON(page, {
        name: 'Test Plan',
        json: testPlan
      });

      await page.goto(timestrip.url);
      // Expand the tree to show the plan
      await page.getByLabel('Show selected item in tree').click();
      await page
        .getByLabel(`Navigate to ${createdPlan.name}`)
        .dragTo(page.getByLabel('Object View'));
      await page.getByLabel('Save').click();
      await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

      return createdPlan;
    });
  });
  test('Create two Time Strips, add a single Plan to both, and verify they can have separate Independent Time Contexts', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5627'
    });

    // Constant locators
    const activityBounds = page.locator('.activity-bounds');

    await test.step('Set time strip to fixed timespan mode and verify activities', async () => {
      const startBound = testPlan.TEST_GROUP[0].start;
      const endBound = testPlan.TEST_GROUP[testPlan.TEST_GROUP.length - 1].end;

      // Switch to fixed time mode with all plan events within the bounds
      await navigateToObjectWithFixedTimeBounds(page, timestrip.url, startBound, endBound);

      // Verify all events are displayed
      const eventCount = await page.locator('.activity-bounds').count();
      expect(eventCount).toEqual(testPlan.TEST_GROUP.length);
    });

    await test.step('TimeStrip can use the Independent Time Conductor', async () => {
      expect(await activityBounds.count()).toEqual(5);

      // Set the independent time bounds so that only one event is shown
      const startBound = testPlan.TEST_GROUP[0].start;
      const endBound = testPlan.TEST_GROUP[0].end;
      const startBoundString = new Date(startBound).toISOString().replace('T', ' ');
      const endBoundString = new Date(endBound).toISOString().replace('T', ' ');

      await setFixedIndependentTimeConductorBounds(page, {
        start: startBoundString,
        end: endBoundString
      });
      expect(await activityBounds.count()).toEqual(1);
    });

    await test.step('Can have multiple TimeStrips with the same plan linked and different Independent Time Contexts', async () => {
      // Create another Time Strip and verify that it has been created
      const createdTimeStrip = await createDomainObjectWithDefaults(page, {
        type: 'Time Strip',
        name: 'Another Time Strip'
      });

      const objectName = await page.locator('.l-browse-bar__object-name').innerText();
      expect(objectName).toBe(createdTimeStrip.name);

      // Drag the existing Plan onto the newly created Time Strip, and save.
      await page.getByLabel(`Navigate to ${plan.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel('Save').click();
      await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

      // All events should be displayed at this point because the
      // initial independent context bounds will match the global bounds
      expect(await activityBounds.count()).toEqual(5);

      // Set the independent time bounds so that two events are shown
      const startBound = testPlan.TEST_GROUP[0].start;
      const endBound = testPlan.TEST_GROUP[1].end;
      const startBoundString = new Date(startBound).toISOString().replace('T', ' ');
      const endBoundString = new Date(endBound).toISOString().replace('T', ' ');

      await setFixedIndependentTimeConductorBounds(page, {
        start: startBoundString,
        end: endBoundString
      });

      // Verify that two events are displayed
      expect(await activityBounds.count()).toEqual(2);

      // Switch to the previous Time Strip and verify that only one event is displayed
      await page.goto(timestrip.url);
      expect(await activityBounds.count()).toEqual(1);
    });
  });

  test('Time strip now line', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7817'
    });

    await test.step('Is displayed in realtime mode', async () => {
      await expect(page.getByLabel('Now Marker')).toBeVisible();
    });

    await test.step('Is hidden when out of bounds of the time axis', async () => {
      // Switch to fixed timespan mode
      await setFixedTimeMode(page);
      // Get the end bounds
      const endBounds = await page.getByLabel('End bounds').textContent();

      // Add 2 minutes to end bound datetime and use it as the new end time
      let endTimeStamp = new Date(endBounds);
      endTimeStamp.setUTCMinutes(endTimeStamp.getUTCMinutes() + 2);
      const endDate = endTimeStamp.toISOString().split('T')[0];
      const milliseconds = endTimeStamp.getMilliseconds();
      const endTime = endTimeStamp.toISOString().split('T')[1].replace(`.${milliseconds}Z`, '');

      // Subtract 1 minute from the end bound and use it as the new start time
      let startTimeStamp = new Date(endBounds);
      startTimeStamp.setUTCMinutes(startTimeStamp.getUTCMinutes() + 1);
      const startDate = startTimeStamp.toISOString().split('T')[0];
      const startMilliseconds = startTimeStamp.getMilliseconds();
      const startTime = startTimeStamp
        .toISOString()
        .split('T')[1]
        .replace(`.${startMilliseconds}Z`, '');
      // Set fixed timespan mode to the future so that "now" is out of bounds.
      await setTimeConductorBounds(page, {
        startDate,
        endDate,
        startTime,
        endTime
      });

      await expect(page.getByLabel('Now Marker')).toBeHidden();
    });
  });
});
