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

import { createDomainObjectWithDefaults, createPlanFromJSON } from '../appActions.js';
import { expect } from '../pluginFixtures.js';

/**
 * Asserts that the number of activities in the plan view matches the number of
 * activities in the plan data within the specified time bounds. Performs an assertion
 * for each activity in the plan data per group, using the earliest activity's
 * start time as the start bound and the current activity's end time as the end bound.
 * @param {import('@playwright/test').Page} page the page
 * @param {object} plan The raw plan json to assert against
 * @param {string} objectUrl The URL of the object to assert against (plan or gantt chart)
 */
export async function assertPlanActivities(page, plan, objectUrl) {
  const groups = Object.keys(plan);
  for (const group of groups) {
    for (let i = 0; i < plan[group].length; i++) {
      // Set the startBound to the start time of the first activity in the group
      const startBound = plan[group][0].start;
      // Set the endBound to the end time of the current activity
      let endBound = plan[group][i].end;
      if (endBound === startBound) {
        // Prevent oddities with setting start and end bound equal
        // via URL params
        endBound += 1;
      }

      // Switch to fixed time mode with all plan events within the bounds
      await page.goto(
        `${objectUrl}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=plan.view`
      );

      // Assert that the number of activities in the plan view matches the number of
      // activities in the plan data within the specified time bounds
      const eventCount = await page.locator('.activity-bounds').count();
      expect(eventCount).toEqual(
        Object.values(plan)
          .flat()
          .filter((event) =>
            activitiesWithinTimeBounds(event.start, event.end, startBound, endBound)
          ).length
      );
    }
  }
}

/**
 * Returns true if the activities time bounds overlap, false otherwise.
 * @param {number} start1 the start time of the first activity
 * @param {number} end1 the end time of the first activity
 * @param {number} start2 the start time of the second activity
 * @param {number} end2 the end time of the second activity
 * @returns {boolean} true if the activities overlap, false otherwise
 */
function activitiesWithinTimeBounds(start1, end1, start2, end2) {
  return (
    (start1 >= start2 && start1 <= end2) ||
    (end1 >= start2 && end1 <= end2) ||
    (start2 >= start1 && start2 <= end1) ||
    (end2 >= start1 && end2 <= end1)
  );
}

/**
 * Asserts that the swim lanes / groups in the plan view matches the order of
 * groups in the plan data.
 * @param {import('@playwright/test').Page} page the page
 * @param {object} plan The raw plan json to assert against
 * @param {string} objectUrl The URL of the object to assert against (plan or gantt chart)
 */
export async function assertPlanOrderedSwimLanes(page, plan, objectUrl) {
  // Switch to the plan view
  await page.goto(`${objectUrl}?view=plan.view`);
  const planGroups = await page
    .locator('.c-plan__contents > div > .c-swimlane__lane-label .c-object-label__name')
    .all();

  const groups = plan.Groups;

  for (let i = 0; i < groups.length; i++) {
    // Assert that the order of groups in the plan view matches the order of
    // groups in the plan data
    const groupName = await planGroups[i].innerText();
    expect(groupName).toEqual(groups[i].name);
  }
}

/**
 * Navigate to the plan view, switch to fixed time mode,
 * and set the bounds to span all activities.
 * @param {import('@playwright/test').Page} page
 * @param {object} planJson
 * @param {string} planObjectUrl
 */
export async function setBoundsToSpanAllActivities(page, planJson, planObjectUrl) {
  // Get the earliest start value
  const start = getEarliestStartTime(planJson);
  // Get the latest end value
  const end = getLatestEndTime(planJson);
  // Set the start and end bounds to the earliest start and latest end
  await page.goto(
    `${planObjectUrl}?tc.mode=fixed&tc.startBound=${start}&tc.endBound=${end}&tc.timeSystem=utc&view=plan.view`
  );
}

/**
 * @param {object} planJson
 * @returns {number}
 */
export function getEarliestStartTime(planJson) {
  const activities = Object.values(planJson).flat();
  return Math.min(...activities.map((activity) => activity.start));
}

/**
 *
 * @param {object} planJson
 * @returns {number}
 */
export function getLatestEndTime(planJson) {
  const activities = Object.values(planJson).flat();
  return Math.max(...activities.map((activity) => activity.end));
}

/**
 *
 * @param {object} planJson
 * @returns {object}
 */
export function getFirstActivity(planJson) {
  const groups = Object.keys(planJson);
  const firstGroupKey = groups[0];
  const firstGroupItems = planJson[firstGroupKey];
  return firstGroupItems[0];
}

/**
 * Uses the Open MCT API to set the status of a plan to 'draft'.
 * @param {import('@playwright/test').Page} page
 * @param {import('../../appActions').CreatedObjectInfo} plan
 */
export async function setDraftStatusForPlan(page, plan) {
  await page.evaluate(async (planObject) => {
    await window.openmct.status.set(planObject.uuid, 'draft');
  }, plan);
}

export async function addPlanGetInterceptor(page) {
  await page.waitForLoadState('load');
  await page.evaluate(async () => {
    await window.openmct.objects.addGetInterceptor({
      appliesTo: (identifier, domainObject) => {
        return domainObject && domainObject.type === 'plan';
      },
      invoke: (identifier, object) => {
        if (object) {
          object.sourceMap = {
            orderedGroups: 'Groups'
          };
        }

        return object;
      }
    });
  });
}

/**
 * Create a Plan from JSON and add it to a Timelist and Navigate to the Plan view
 * @param {import('@playwright/test').Page} page
 */
export async function createTimelistWithPlanAndSetActivityInProgress(page, planJson) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  const timelist = await createDomainObjectWithDefaults(page, {
    name: 'Time List',
    type: 'Time List'
  });

  await createPlanFromJSON(page, {
    name: 'Test Plan',
    json: planJson,
    parent: timelist.uuid
  });

  // Ensure that all activities are shown in the expanded view
  const groups = Object.keys(planJson);
  const firstGroupKey = groups[0];
  const firstGroupItems = planJson[firstGroupKey];
  const firstActivityForPlan = firstGroupItems[0];
  const lastActivity = firstGroupItems[firstGroupItems.length - 1];
  const startBound = firstActivityForPlan.start;
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

  const anActivity = page.getByRole('row').nth(0);

  // Set the activity to in progress
  await anActivity.click();
  await page.getByRole('tab', { name: 'Activity' }).click();
  await page.getByLabel('Activity Status', { exact: true }).selectOption({ label: 'In progress' });
}
