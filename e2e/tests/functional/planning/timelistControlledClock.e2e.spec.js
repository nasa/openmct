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

/*
Collection of Time List tests set to run with browser clock manipulate made possible with the
clockOptions plugin fixture.
*/

import fs from 'fs';

import { createDomainObjectWithDefaults, createPlanFromJSON } from '../../../appActions.js';
import {
  createTimelistWithPlanAndSetActivityInProgress,
  getEarliestStartTime,
  getFirstActivity
} from '../../../helper/planningUtils';
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

const TIME_TO_FROM_COLUMN = 2;
const HEADER_ROW = 0;
const NUM_COLUMNS = 5;
const FULL_CIRCLE_PATH =
  'M3.061616997868383e-15,-50A50,50,0,1,1,-3.061616997868383e-15,50A50,50,0,1,1,3.061616997868383e-15,-50Z';

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
 * @typedef {Object} CountdownOrUpObject
 * @property {string} sign - The sign of the countdown ('-' if the countdown is negative, '+' otherwise).
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

test.describe('Time List with controlled clock @clock', () => {
  test.use({
    clockOptions: {
      now: getEarliestStartTime(examplePlanSmall3),
      shouldAdvanceTime: true
    }
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
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

    //Expand the viewport to show the entire time list
    await page.getByLabel('Collapse Inspect Pane').click();
    await page.getByLabel('Collapse Browse Pane').click();
  });
  test('Time List shows current events and counts down correctly in real-time mode', async ({
    page
  }) => {
    const countUpCells = [
      getTimeListCellByIndex(page, 1, TIME_TO_FROM_COLUMN),
      getTimeListCellByIndex(page, 2, TIME_TO_FROM_COLUMN)
    ];
    const countdownCells = [
      getTimeListCellByIndex(page, 3, TIME_TO_FROM_COLUMN),
      getTimeListCellByIndex(page, 4, TIME_TO_FROM_COLUMN)
    ];

    // Verify that the countdown cells are counting down
    for (let i = 0; i < countdownCells.length; i++) {
      await test.step(`Countdown cell ${i + 1} counts down`, async () => {
        const countdownCell = countdownCells[i];
        // Get the initial countdown timestamp object
        const beforeCountdown = await getAndAssertCountdownOrUpObject(page, i + 3);
        // should not have a '-' sign
        await expect(countdownCell).not.toHaveText('-');
        // Wait until it changes
        await expect(countdownCell).not.toHaveText(beforeCountdown.toString());
        // Get the new countdown timestamp object
        const afterCountdown = await getAndAssertCountdownOrUpObject(page, i + 3);
        // Verify that the new countdown timestamp object is less than the old one
        expect(Number(afterCountdown.seconds)).toBeLessThan(Number(beforeCountdown.seconds));
      });
    }

    // Verify that the count-up cells are counting up
    for (let i = 0; i < countUpCells.length; i++) {
      await test.step(`Count-up cell ${i + 1} counts up`, async () => {
        const countUpCell = countUpCells[i];
        // Get the initial count-up timestamp object
        const beforeCountUp = await getAndAssertCountdownOrUpObject(page, i + 1);
        // should not have a '+' sign
        await expect(countUpCell).not.toHaveText('+');
        // Wait until it changes
        await expect(countUpCell).not.toHaveText(beforeCountUp.toString());
        // Get the new count-up timestamp object
        const afterCountUp = await getAndAssertCountdownOrUpObject(page, i + 1);
        // Verify that the new count-up timestamp object is greater than the old one
        expect(Number(afterCountUp.seconds)).toBeGreaterThan(Number(beforeCountUp.seconds));
      });
    }
  });
});

test.describe('Activity progress when activity is in the future @clock', () => {
  const firstActivity = getFirstActivity(examplePlanSmall1);

  test.use({
    clockOptions: {
      now: firstActivity.start - 1,
      shouldAdvanceTime: true
    }
  });

  test.beforeEach(async ({ page }) => {
    await createTimelistWithPlanAndSetActivityInProgress(page, examplePlanSmall1);
  });

  test('progress pie is empty', async ({ page }) => {
    const anActivity = page.getByRole('row').nth(0);
    // Progress pie shows no progress when now is less than the start time
    await expect(anActivity.getByLabel('Activity in progress').locator('path')).not.toHaveAttribute(
      'd'
    );
  });
});

test.describe('Activity progress when now is between start and end of the activity @clock', () => {
  const firstActivity = getFirstActivity(examplePlanSmall1);
  test.beforeEach(async ({ page }) => {
    await createTimelistWithPlanAndSetActivityInProgress(page, examplePlanSmall1);
  });

  test.use({
    clockOptions: {
      now: firstActivity.start + 50000,
      shouldAdvanceTime: true
    }
  });

  test('progress pie is partially filled', async ({ page }) => {
    const anActivity = page.getByRole('row').nth(0);
    const pathElement = anActivity.getByLabel('Activity in progress').locator('path');
    // Progress pie shows progress when now is greater than the start time
    await expect(pathElement).toHaveAttribute('d');
  });
});

test.describe('Activity progress when now is after end of the activity @clock', () => {
  const firstActivity = getFirstActivity(examplePlanSmall1);

  test.use({
    clockOptions: {
      now: firstActivity.end + 10000,
      shouldAdvanceTime: true
    }
  });

  test.beforeEach(async ({ page }) => {
    await createTimelistWithPlanAndSetActivityInProgress(page, examplePlanSmall1);
  });

  test('progress pie is full', async ({ page }) => {
    const anActivity = page.getByRole('row').nth(0);
    // Progress pie is completely full and doesn't update if now is greater than the end time
    await expect(anActivity.getByLabel('Activity in progress').locator('path')).toHaveAttribute(
      'd',
      FULL_CIRCLE_PATH
    );
  });
});

/**
 * Get the cell at the given row and column indices.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @returns {import('@playwright/test').Locator} cell
 */
function getTimeListCellByIndex(page, rowIndex, columnIndex) {
  return page.getByRole('cell').nth(rowIndex * NUM_COLUMNS + columnIndex);
}

/**
 * Return the innerText of the cell at the given row and column indices.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @returns {Promise<string>} text
 */
async function getTimeListCellTextByIndex(page, rowIndex, columnIndex) {
  const text = await getTimeListCellByIndex(page, rowIndex, columnIndex).innerText();
  return text;
}

/**
 * Get the text from the countdown (or countup) cell in the given row, assert that it matches the countdown/countup
 * regex, and return an object representing the countdown.
 * @param {import('@playwright/test').Page} page
 * @param {number} rowIndex the row index
 * @returns {Promise<CountdownOrUpObject>} The countdown (or countup) object
 */
async function getAndAssertCountdownOrUpObject(page, rowIndex) {
  const timeToFrom = await getTimeListCellTextByIndex(
    page,
    HEADER_ROW + rowIndex,
    TIME_TO_FROM_COLUMN
  );

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
