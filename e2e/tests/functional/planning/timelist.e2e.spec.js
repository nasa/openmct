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
import { getEarliestStartTime } from '../../../helper/planningUtils';
import { expect, test } from '../../../pluginFixtures.js';

const examplePlanSmall3 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small3.json', import.meta.url)
  )
);
const examplePlanSmall1 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
  )
);
// eslint-disable-next-line no-unused-vars
const START_TIME_COLUMN = 0;
// eslint-disable-next-line no-unused-vars
const END_TIME_COLUMN = 1;
const TIME_TO_FROM_COLUMN = 2;
// eslint-disable-next-line no-unused-vars
const ACTIVITY_COLUMN = 3;
const HEADER_ROW = 0;
const NUM_COLUMNS = 4;

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

/**
 * The regular expression used to parse the countdown string.
 * Some examples of valid Countdown strings:
 * ```
 * '35D 02:03:04'
 * '-1D 01:02:03'
 * '01:02:03'
 * '-05:06:07'
 * ```
 */
const COUNTDOWN_REGEXP = /(-)?(\d+D\s)?(\d{2}):(\d{2}):(\d{2})/;

/**
 * @typedef {Object} CountdownObject
 * @property {string} sign - The sign of the countdown ('-' if the countdown is negative, otherwise undefined).
 * @property {string} days - The number of days in the countdown (undefined if there are no days).
 * @property {string} hours - The number of hours in the countdown.
 * @property {string} minutes - The number of minutes in the countdown.
 * @property {string} seconds - The number of seconds in the countdown.
 * @property {string} toString - The countdown string.
 */

/**
 * Object representing the indices of the capture groups in a countdown regex match.
 *
 * @typedef {{ SIGN: number, DAYS: number, HOURS: number, MINUTES: number, SECONDS: number, REGEXP: RegExp }}
 * @property {number} SIGN - The index for the sign capture group (1 if a '-' sign is present, otherwise undefined).
 * @property {number} DAYS - The index for the days capture group (2 for the number of days, otherwise undefined).
 * @property {number} HOURS - The index for the hours capture group (3 for the hour part of the time).
 * @property {number} MINUTES - The index for the minutes capture group (4 for the minute part of the time).
 * @property {number} SECONDS - The index for the seconds capture group (5 for the second part of the time).
 */
const COUNTDOWN = Object.freeze({
  SIGN: 1,
  DAYS: 2,
  HOURS: 3,
  MINUTES: 4,
  SECONDS: 5
});

test.describe('Time List with controlled clock', () => {
  test.use({
    clockOptions: {
      now: getEarliestStartTime(examplePlanSmall3),
      shouldAdvanceTime: true
    }
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('Time List shows current events and counts down correctly in real-time mode', async ({
    page
  }) => {
    await test.step('Create a Time List, add a Plan to it, and switch to real-time mode', async () => {
      // Create Time List
      const timelist = await createDomainObjectWithDefaults(page, {
        type: 'Time List'
      });

      // Create a Plan with events that count down and up.
      // Add it as a child to the Time List.
      await createPlanFromJSON(page, {
        json: examplePlanSmall3,
        parent: timelist.uuid
      });

      // Navigate to the Time List in real-time mode
      await page.goto(
        `${timelist.url}?tc.mode=local&tc.startDelta=900000&tc.endDelta=1800000&tc.timeSystem=utc&view=grid`
      );
    });

    const countUpCells = [
      getCellByIndex(page, 1, TIME_TO_FROM_COLUMN),
      getCellByIndex(page, 2, TIME_TO_FROM_COLUMN)
    ];
    const countdownCells = [
      getCellByIndex(page, 3, TIME_TO_FROM_COLUMN),
      getCellByIndex(page, 4, TIME_TO_FROM_COLUMN)
    ];

    // Verify that the countdown cells are counting down
    for (let i = 0; i < countdownCells.length; i++) {
      await test.step(`Countdown cell ${i + 1} counts down`, async () => {
        const countdownCell = countdownCells[i];
        // Get the initial countdown timestamp object
        const beforeCountdown = await getAndAssertCountdownObject(page, i + 3);
        // Wait until it changes
        await expect(countdownCell).not.toHaveText(beforeCountdown.toString());
        // Get the new countdown timestamp object
        const afterCountdown = await getAndAssertCountdownObject(page, i + 3);
        // Verify that the new countdown timestamp object is less than the old one
        expect(Number(afterCountdown.seconds)).toBeLessThan(Number(beforeCountdown.seconds));
      });
    }

    // Verify that the count-up cells are counting up
    for (let i = 0; i < countUpCells.length; i++) {
      await test.step(`Count-up cell ${i + 1} counts up`, async () => {
        const countdownCell = countUpCells[i];
        // Get the initial count-up timestamp object
        const beforeCountdown = await getAndAssertCountdownObject(page, i + 1);
        // Wait until it changes
        await expect(countdownCell).not.toHaveText(beforeCountdown.toString());
        // Get the new count-up timestamp object
        const afterCountdown = await getAndAssertCountdownObject(page, i + 1);
        // Verify that the new count-up timestamp object is greater than the old one
        expect(Number(afterCountdown.seconds)).toBeGreaterThan(Number(beforeCountdown.seconds));
      });
    }
  });
});

/**
 * Get the cell at the given row and column indices.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @returns {import('@playwright/test').Locator} cell
 */
function getCellByIndex(page, rowIndex, columnIndex) {
  return page.getByRole('cell').nth(rowIndex * NUM_COLUMNS + columnIndex);
}

/**
 * Return the innerText of the cell at the given row and column indices.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @returns {Promise<string>} text
 */
async function getCellTextByIndex(page, rowIndex, columnIndex) {
  const text = await getCellByIndex(page, rowIndex, columnIndex).innerText();
  return text;
}

/**
 * Get the text from the countdown cell in the given row, assert that it matches the countdown
 * regex, and return an object representing the countdown.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex the row index
 * @returns {Promise<CountdownObject>} countdownObject
 */
async function getAndAssertCountdownObject(page, rowIndex) {
  const timeToFrom = await getCellTextByIndex(page, HEADER_ROW + rowIndex, TIME_TO_FROM_COLUMN);

  expect(timeToFrom).toMatch(COUNTDOWN_REGEXP);
  const match = timeToFrom.match(COUNTDOWN_REGEXP);

  return {
    sign: match[COUNTDOWN.SIGN],
    days: match[COUNTDOWN.DAYS],
    hours: match[COUNTDOWN.HOURS],
    minutes: match[COUNTDOWN.MINUTES],
    seconds: match[COUNTDOWN.SECONDS],
    toString: () => timeToFrom
  };
}
