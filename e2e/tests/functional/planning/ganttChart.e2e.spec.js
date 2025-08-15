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
import {
  assertPlanActivities,
  setBoundsToSpanAllActivities
} from '../../../helper/planningUtils.js';
import { expect, test } from '../../../pluginFixtures.js';

const testPlan1 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);
const testPlan2 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small2.json', import.meta.url)
  )
);

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
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

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
    await page.getByRole('tab', { name: 'Activity' }).click();

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

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

function normalizeAge(num) {
  const hundredtized = num * 100;
  const isWhole = hundredtized % 100 === 0;

  return isWhole ? hundredtized / 100 : num;
}

function padLeadingZeros(num, numOfLeadingZeros) {
  return num.toString().padStart(numOfLeadingZeros, '0');
}

function toDoubleDigits(num) {
  return padLeadingZeros(num, 2);
}

function toTripleDigits(num) {
  return padLeadingZeros(num, 3);
}

function getPreciseDuration(value, { excludeMilliSeconds, useDayFormat } = {}) {
  let preciseDuration;
  const ms = value || 0;

  const duration = [
    Math.floor(normalizeAge(ms / ONE_DAY)),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_DAY) / ONE_HOUR))),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_HOUR) / ONE_MINUTE))),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_MINUTE) / ONE_SECOND)))
  ];
  if (!excludeMilliSeconds) {
    duration.push(toTripleDigits(Math.floor(normalizeAge(ms % ONE_SECOND))));
  }

  if (useDayFormat) {
    // Format days as XD
    const days = duration.shift();
    if (days > 0) {
      preciseDuration = `${days}D ${duration.join(':')}`;
    } else {
      preciseDuration = duration.join(':');
    }
  } else {
    const days = toDoubleDigits(duration.shift());
    duration.unshift(days);
    preciseDuration = duration.join(':');
  }

  return preciseDuration;
}
