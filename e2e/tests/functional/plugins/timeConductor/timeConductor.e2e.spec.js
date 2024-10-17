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
  setStartOffset
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Time conductor operations', () => {
  const DAY = '2024-01-01';
  const DAY_AFTER = '2024-01-02';
  const ONE_O_CLOCK = '01:00:00';
  const TWO_O_CLOCK = '02:00:00';

  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('validate date and time inputs are validated on input event', async ({ page }) => {
    const submitButtonLocator = page.getByLabel('Submit time bounds');

    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    await test.step('invalid start date disables submit button', async () => {
      const initialStartDate = await page.getByLabel('Start date').inputValue();
      const invalidStartDate = `${initialStartDate.substring(0, 5)}${initialStartDate.substring(6)}`;

      await page.getByLabel('Start date').fill(invalidStartDate);
      await expect(submitButtonLocator).toBeDisabled();
      await page.getByLabel('Start date').fill(initialStartDate);
      await expect(submitButtonLocator).toBeEnabled();
    });

    await test.step('invalid start time disables submit button', async () => {
      const initialStartTime = await page.getByLabel('Start time').inputValue();
      const invalidStartTime = `${initialStartTime.substring(0, 5)}${initialStartTime.substring(6)}`;

      await page.getByLabel('Start time').fill(invalidStartTime);
      await expect(submitButtonLocator).toBeDisabled();
      await page.getByLabel('Start time').fill(initialStartTime);
      await expect(submitButtonLocator).toBeEnabled();
    });

    await test.step('disable/enable submit button also works with multiple invalid inputs', async () => {
      const initialEndDate = await page.getByLabel('End date').inputValue();
      const invalidEndDate = `${initialEndDate.substring(0, 5)}${initialEndDate.substring(6)}`;
      const initialStartTime = await page.getByLabel('Start time').inputValue();
      const invalidStartTime = `${initialStartTime.substring(0, 5)}${initialStartTime.substring(6)}`;

      await page.getByLabel('Start time').fill(invalidStartTime);
      await expect(submitButtonLocator).toBeDisabled();
      await page.getByLabel('End date').fill(invalidEndDate);
      await expect(submitButtonLocator).toBeDisabled();
      await page.getByLabel('End date').fill(initialEndDate);
      await expect(submitButtonLocator).toBeDisabled();
      await page.getByLabel('Start time').fill(initialStartTime);
      await expect(submitButtonLocator).toBeEnabled();
    });
  });

  test('validate date and time inputs validation is reported on change event', async ({ page }) => {
    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    await test.step('invalid start date is reported on change event, not on input event', async () => {
      const initialStartDate = await page.getByLabel('Start date').inputValue();
      const invalidStartDate = `${initialStartDate.substring(0, 5)}${initialStartDate.substring(6)}`;

      await page.getByLabel('Start date').fill(invalidStartDate);
      await expect(page.getByLabel('Start date')).not.toHaveAttribute('title', 'Invalid Date');
      await page.getByLabel('Start date').press('Tab');
      await expect(page.getByLabel('Start date')).toHaveAttribute('title', 'Invalid Date');
      await page.getByLabel('Start date').fill(initialStartDate);
      await expect(page.getByLabel('Start date')).not.toHaveAttribute('title', 'Invalid Date');
    });

    await test.step('invalid start time is reported on change event, not on input event', async () => {
      const initialStartTime = await page.getByLabel('Start time').inputValue();
      const invalidStartTime = `${initialStartTime.substring(0, 5)}${initialStartTime.substring(6)}`;

      await page.getByLabel('Start time').fill(invalidStartTime);
      await expect(page.getByLabel('Start time')).not.toHaveAttribute('title', 'Invalid Time');
      await page.getByLabel('Start time').press('Tab');
      await expect(page.getByLabel('Start time')).toHaveAttribute('title', 'Invalid Time');
      await page.getByLabel('Start time').fill(initialStartTime);
      await expect(page.getByLabel('Start time')).not.toHaveAttribute('title', 'Invalid Time');
    });

    await test.step('invalid end date is reported on change event, not on input event', async () => {
      const initialEndDate = await page.getByLabel('End date').inputValue();
      const invalidEndDate = `${initialEndDate.substring(0, 5)}${initialEndDate.substring(6)}`;

      await page.getByLabel('End date').fill(invalidEndDate);
      await expect(page.getByLabel('End date')).not.toHaveAttribute('title', 'Invalid Date');
      await page.getByLabel('End date').press('Tab');
      await expect(page.getByLabel('End date')).toHaveAttribute('title', 'Invalid Date');
      await page.getByLabel('End date').fill(initialEndDate);
      await expect(page.getByLabel('End date')).not.toHaveAttribute('title', 'Invalid Date');
    });

    await test.step('invalid end time is reported on change event, not on input event', async () => {
      const initialEndTime = await page.getByLabel('End time').inputValue();
      const invalidEndTime = `${initialEndTime.substring(0, 5)}${initialEndTime.substring(6)}`;

      await page.getByLabel('End time').fill(invalidEndTime);
      await expect(page.getByLabel('End time')).not.toHaveAttribute('title', 'Invalid Time');
      await page.getByLabel('End time').press('Tab');
      await expect(page.getByLabel('End time')).toHaveAttribute('title', 'Invalid Time');
      await page.getByLabel('End time').fill(initialEndTime);
      await expect(page.getByLabel('End time')).not.toHaveAttribute('title', 'Invalid Time');
    });
  });

  test('validate start time does not exceed end time on submit', async ({ page }) => {
    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    // FIXME: https://github.com/nasa/openmct/pull/7818
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await page.getByLabel('Start date').fill(DAY);
    await page.getByLabel('Start time').fill(TWO_O_CLOCK);
    await page.getByLabel('End date').fill(DAY);
    await page.getByLabel('End time').fill(ONE_O_CLOCK);
    await page.getByLabel('Submit time bounds').click();

    await expect(page.getByLabel('Start date')).toHaveAttribute(
      'title',
      'Specified start date exceeds end bound'
    );
    await expect(page.getByLabel('Start bounds')).not.toHaveText(`${DAY} ${TWO_O_CLOCK}.000Z`);
    await expect(page.getByLabel('End bounds')).not.toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);

    await page.getByLabel('Start date').fill(DAY);
    await page.getByLabel('Start time').fill(ONE_O_CLOCK);
    await page.getByLabel('End date').fill(DAY);
    await page.getByLabel('End time').fill(TWO_O_CLOCK);
    await page.getByLabel('Submit time bounds').click();

    await expect(page.getByLabel('Start bounds')).toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);
    await expect(page.getByLabel('End bounds')).toHaveText(`${DAY} ${TWO_O_CLOCK}.000Z`);
  });

  test('validate start datetime does not exceed end datetime on submit', async ({ page }) => {
    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    // FIXME: https://github.com/nasa/openmct/pull/7818
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await page.getByLabel('Start date').fill(DAY_AFTER);
    await page.getByLabel('Start time').fill(ONE_O_CLOCK);
    await page.getByLabel('End date').fill(DAY);
    await page.getByLabel('End time').fill(ONE_O_CLOCK);
    await page.getByLabel('Submit time bounds').click();

    await expect(page.getByLabel('Start date')).toHaveAttribute(
      'title',
      'Specified start date exceeds end bound'
    );
    await expect(page.getByLabel('Start bounds')).not.toHaveText(
      `${DAY_AFTER} ${ONE_O_CLOCK}.000Z`
    );
    await expect(page.getByLabel('End bounds')).not.toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);

    await page.getByLabel('Start date').fill(DAY);
    await page.getByLabel('Start time').fill(ONE_O_CLOCK);
    await page.getByLabel('End date').fill(DAY_AFTER);
    await page.getByLabel('End time').fill(ONE_O_CLOCK);
    await page.getByLabel('Submit time bounds').click();

    await expect(page.getByLabel('Start bounds')).toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);
    await expect(page.getByLabel('End bounds')).toHaveText(`${DAY_AFTER} ${ONE_O_CLOCK}.000Z`);
  });

  test('cancelling form does not set bounds', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7791'
    });

    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    await page.getByLabel('Start date').fill(DAY);
    await page.getByLabel('Start time').fill(ONE_O_CLOCK);
    await page.getByLabel('End date').fill(DAY_AFTER);
    await page.getByLabel('End time').fill(ONE_O_CLOCK);
    await page.getByLabel('Discard changes and close time popup').click();

    await expect(page.getByLabel('Start bounds')).not.toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);
    await expect(page.getByLabel('End bounds')).not.toHaveText(`${DAY_AFTER} ${ONE_O_CLOCK}.000Z`);

    // Open the time conductor popup
    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();

    await page.getByLabel('Start date').fill(DAY);
    await page.getByLabel('Start time').fill(ONE_O_CLOCK);
    await page.getByLabel('End date').fill(DAY_AFTER);
    await page.getByLabel('End time').fill(ONE_O_CLOCK);
    await page.getByLabel('Submit time bounds').click();

    await expect(page.getByLabel('Start bounds')).toHaveText(`${DAY} ${ONE_O_CLOCK}.000Z`);
    await expect(page.getByLabel('End bounds')).toHaveText(`${DAY_AFTER} ${ONE_O_CLOCK}.000Z`);
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
