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

const { test, expect } = require('../../../../pluginFixtures');
const {
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset,
  setEndOffset,
  setTimeConductorBounds
} = require('../../../../appActions');

test.describe('Time conductor operations', () => {
  test('validate start time does not exceeds end time', async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    const year = new Date().getFullYear();

    let startDate = 'xxxx-01-01 01:00:00.000Z';
    startDate = year + startDate.substring(4);

    let endDate = 'xxxx-01-01 02:00:00.000Z';
    endDate = year + endDate.substring(4);

    await setTimeConductorBounds(page, startDate, endDate);

    // invalid start date
    startDate = year + 1 + startDate.substring(4);
    await setTimeConductorBounds(page, startDate);

    // Bring up the time conductor popup
    const timeConductorMode = await page.locator('.c-compact-tc');
    await timeConductorMode.click();
    const startDateLocator = page.locator('input[type="text"]').first();
    const endDateLocator = page.locator('input[type="text"]').nth(2);

    await endDateLocator.click();

    const startDateValidityStatus = await startDateLocator.evaluate((element) =>
      element.checkValidity()
    );
    expect(startDateValidityStatus).not.toBeTruthy();

    // fix to valid start date
    startDate = year - 1 + startDate.substring(4);
    await setTimeConductorBounds(page, startDate);

    // invalid end date
    endDate = year - 2 + endDate.substring(4);
    await setTimeConductorBounds(page, undefined, endDate);

    await startDateLocator.click();

    const endDateValidityStatus = await endDateLocator.evaluate((element) =>
      element.checkValidity()
    );
    expect(endDateValidityStatus).not.toBeTruthy();
  });
});

// Testing instructions:
// Try to change the realtime offsets when in realtime (local clock) mode.
test.describe('Time conductor input fields real-time mode', () => {
  test('validate input fields in real-time mode', async ({ page }) => {
    const startOffset = {
      startSecs: '23'
    };

    const endOffset = {
      endSecs: '31'
    };

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Switch to real-time mode
    await setRealTimeMode(page);

    // Set start time offset
    await setStartOffset(page, startOffset);

    // Verify time was updated on time offset button
    await expect(page.locator('.c-compact-tc__setting-value.icon-minus')).toContainText('00:30:23');

    // Set end time offset
    await setEndOffset(page, endOffset);

    // Verify time was updated on preceding time offset button
    await expect(page.locator('.c-compact-tc__setting-value.icon-plus')).toContainText('00:00:31');
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
    await expect(page.locator('.c-compact-tc__setting-value.icon-minus')).toContainText('00:30:23');

    // Verify updated end time offset persists after mode switch
    await expect(page.locator('.c-compact-tc__setting-value.icon-plus')).toContainText('00:00:01');

    // Verify url parameters persist after mode switch
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    expect(page.url()).toContain(`startDelta=${startDelta}`);
    expect(page.url()).toContain(`endDelta=${endDelta}`);
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

test.describe('Time Conductor History', () => {
  test('shows milliseconds on hover @unstable', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/4386'
    });
    // Navigate to Open MCT in Fixed Time Mode, UTC Time System
    // with startBound at 2022-01-01 00:00:00.000Z
    // and endBound at 2022-01-01 00:00:00.200Z
    await page.goto(
      './#/browse/mine?view=grid&tc.mode=fixed&tc.startBound=1640995200000&tc.endBound=1640995200200&tc.timeSystem=utc&hideInspector=true'
    );
    await page.getByRole('button', { name: 'Time Conductor Settings' }).click();
    await page.getByRole('button', { name: 'Time Conductor History' }).hover({ trial: true });
    await page.getByRole('button', { name: 'Time Conductor History' }).click();

    // Validate history item format
    const historyItem = page.locator('text="2022-01-01 00:00:00 + 200ms"');
    await expect(historyItem).toBeEnabled();
    await expect(historyItem).toHaveAttribute(
      'title',
      '2022-01-01 00:00:00.000 - 2022-01-01 00:00:00.200'
    );
  });
});
