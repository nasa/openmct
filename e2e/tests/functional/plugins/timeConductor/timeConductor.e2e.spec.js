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
  setEndOffset,
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset,
  setTimeConductorBounds
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Time conductor operations', () => {
  test('validate start time does not exceed end time', async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    const year = new Date().getFullYear();

    // Set initial valid time bounds
    const startDate = `${year}-01-01`;
    const startTime = '01:00:00';
    const endDate = `${year}-01-01`;
    const endTime = '02:00:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    // Test invalid start date
    const invalidStartDate = `${year}-01-02`;
    await page.getByLabel('Start date').fill(invalidStartDate);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('Start date').fill(startDate);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid end date
    const invalidEndDate = `${year - 1}-12-31`;
    await page.getByLabel('End date').fill(invalidEndDate);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('End date').fill(endDate);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid start time
    const invalidStartTime = '42:00:00';
    await page.getByLabel('Start time').fill(invalidStartTime);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('Start time').fill(startTime);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid end time
    const invalidEndTime = '43:00:00';
    await page.getByLabel('End time').fill(invalidEndTime);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('End time').fill(endTime);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Submit valid time bounds
    await page.getByLabel('Submit time bounds').click();

    // Verify the submitted time bounds
    await expect(page.getByLabel('Start bounds')).toHaveText(
      new RegExp(`${startDate} ${startTime}.000Z`)
    );
    await expect(page.getByLabel('End bounds')).toHaveText(
      new RegExp(`${endDate} ${endTime}.000Z`)
    );
  });
});

test.describe('Global Time Conductor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Input field validation: real-time mode', async ({ page }) => {
    const startOffset = {
      startHours: '01',
      startMins: '29',
      startSecs: '23'
    };

    const endOffset = {
      endHours: '01',
      endMins: '30',
      endSecs: '31'
    };

    // Switch to real-time mode
    await setRealTimeMode(page);

    // Set start time offset
    await setStartOffset(page, startOffset);

    // Verify time was updated on time offset button
    await expect(page.getByLabel('Start offset: 01:29:23')).toBeVisible();

    // Set end time offset
    await setEndOffset(page, endOffset);

    // Verify time was updated on preceding time offset button
    await expect(page.getByLabel('End offset: 01:30:31')).toBeVisible();

    // Discard changes and verify that offsets remain unchanged
    await setStartOffset(page, {
      startHours: '00',
      startMins: '30',
      startSecs: '00',
      submitChanges: false
    });

    await expect(page.getByLabel('Start offset: 01:29:23')).toBeVisible();
    await expect(page.getByLabel('End offset: 01:30:31')).toBeVisible();
  });

  test('Input field validation: fixed time mode', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7791'
    });
    // Switch to fixed time mode
    await setFixedTimeMode(page);

    // Define valid time bounds for testing
    const validBounds = {
      startDate: '2024-04-20',
      startTime: '00:04:20',
      endDate: '2024-04-20',
      endTime: '16:04:20'
    };
    // Set valid time conductor bounds ✌️
    await setTimeConductorBounds(page, validBounds);

    // Verify that the time bounds are set correctly
    await expect(page.getByLabel(`Start bounds: 2024-04-20 00:04:20.000Z`)).toBeVisible();
    await expect(page.getByLabel(`End bounds: 2024-04-20 16:04:20.000Z`)).toBeVisible();

    // Open the Time Conductor Mode popup
    await page.getByLabel('Time Conductor Mode').click();

    // Test invalid start date
    const invalidStartDate = '2024-04-21';
    await page.getByLabel('Start date').fill(invalidStartDate);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('Start date').fill(validBounds.startDate);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid end date
    const invalidEndDate = '2024-04-19';
    await page.getByLabel('End date').fill(invalidEndDate);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('End date').fill(validBounds.endDate);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid start time
    const invalidStartTime = '16:04:21';
    await page.getByLabel('Start time').fill(invalidStartTime);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('Start time').fill(validBounds.startTime);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Test invalid end time
    const invalidEndTime = '00:04:19';
    await page.getByLabel('End time').fill(invalidEndTime);
    await expect(page.getByLabel('Submit time bounds')).toBeDisabled();
    await page.getByLabel('End time').fill(validBounds.endTime);
    await expect(page.getByLabel('Submit time bounds')).toBeEnabled();

    // Verify that the time bounds remain unchanged after invalid inputs
    await expect(page.getByLabel(`Start bounds: 2024-04-20 00:04:20.000Z`)).toBeVisible();
    await expect(page.getByLabel(`End bounds: 2024-04-20 16:04:20.000Z`)).toBeVisible();

    // Discard changes and verify that bounds remain unchanged
    await setTimeConductorBounds(page, {
      startDate: validBounds.startDate,
      startTime: '04:20:00',
      endDate: validBounds.endDate,
      endTime: '04:20:20',
      submitChanges: false
    });

    // Verify that the original time bounds are still displayed after discarding changes
    await expect(page.getByLabel(`Start bounds: 2024-04-20 00:04:20.000Z`)).toBeVisible();
    await expect(page.getByLabel(`End bounds: 2024-04-20 16:04:20.000Z`)).toBeVisible();
  });

  /**
   * Verify that offsets and url params are preserved when switching
   * between fixed timespan and real-time mode.
   */
  test('preserve offsets and url params when switching between fixed and real-time mode', async ({
    page
  }) => {
    const startOffset = {
      startMins: '30',
      startSecs: '23'
    };

    const endOffset = {
      endSecs: '01'
    };

    // Convert offsets to milliseconds
    const startDelta = 30 * 60 * 1000 + 23 * 1000;
    const endDelta = 1 * 1000;

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Switch to real-time mode
    await setRealTimeMode(page);

    // Set start time offset
    await setStartOffset(page, startOffset);

    // Set end time offset
    await setEndOffset(page, endOffset);

    // Switch to fixed timespan mode
    await setFixedTimeMode(page);

    // Switch back to real-time mode
    await setRealTimeMode(page);

    // Verify updated start time offset persists after mode switch
    await expect(page.getByLabel('Start offset: 00:30:23')).toBeVisible();

    // Verify updated end time offset persists after mode switch
    await expect(page.getByLabel('End offset: 00:00:01')).toBeVisible();

    // Verify url parameters persist after mode switch
    // eslint-disable-next-line no-useless-escape
    const urlRegex = new RegExp(`.*tc\.startDelta=${startDelta}&tc\.endDelta=${endDelta}.*`);
    await page.waitForURL(urlRegex);
  });

  test.fixme(
    'time conductor history in fixed time mode will track changing start and end times',
    async ({ page }) => {
      // change start time, verify it's tracked in history
      // change end time, verify it's tracked in history
    }
  );

  test.fixme(
    'time conductor history in realtime mode will track changing start and end times',
    async ({ page }) => {
      // change start offset, verify it's tracked in history
      // change end offset, verify it's tracked in history
    }
  );

  test.fixme(
    'time conductor history allows you to set a historical timeframe',
    async ({ page }) => {
      // make sure there are historical history options
      // select an option and make sure the time conductor start and end bounds are updated correctly
    }
  );

  test.fixme('time conductor history allows you to set a realtime offsets', async ({ page }) => {
    // make sure there are realtime history options
    // select an option and verify the offsets are updated correctly
  });
});
