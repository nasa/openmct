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

/**
 * This test is dedicated to test notification banner functionality and its accessibility attributes.
 */

import percySnapshot from '@percy/playwright';

import { createNotification } from '../../appActions.js';
import { expect, scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_URL } from '../../constants.js';

test.describe('Visual - Notifications @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Alert Levels and Notification List Modal', async ({ page, theme }) => {
    await createNotification(page, {
      message: 'Test info notification',
      severity: 'info'
    });
    await expect(page.getByText('Test info notification')).toBeVisible();
    await percySnapshot(page, `Info Notification banner shown (theme: '${theme}')`);
    await page.getByLabel('Dismiss').click();
    await page.getByRole('alert').waitFor({ state: 'detached' });
    await createNotification(page, {
      message: 'Test alert notification',
      severity: 'alert'
    });
    await expect(page.getByText('Test alert notification')).toBeVisible();
    await percySnapshot(page, `Alert Notification banner shown (theme: '${theme}')`);
    await page.getByLabel('Dismiss').click();
    await page.getByRole('alert').waitFor({ state: 'detached' });
    await createNotification(page, {
      message: 'Test error notification',
      severity: 'error'
    });
    await expect(page.getByText('Test error notification')).toBeVisible();
    await percySnapshot(page, `Error Notification banner shown (theme: '${theme}')`);
    await page.getByLabel('Dismiss').click();
    await page.getByRole('alert').waitFor({ state: 'detached' });

    await page.getByLabel('Review 2 Notifications').click();
    await page.getByText('Test alert notification').waitFor();
    await percySnapshot(page, `Notification List Modal with alert and error (theme: '${theme}')`);

    // Skipping due to https://github.com/nasa/openmct/issues/6820
    // await page.getByLabel('Dismiss notification of Test alert notification').click();
    // await page.getByText('Test alert notification').waitFor({ state: 'detached' });
    // await percySnapshot(page, `Notification Modal with error only (theme: '${theme}')`);

    await page.getByRole('button', { name: 'Clear All Notifications', exact: true }).click();
    await percySnapshot(page, `Notification Modal after Clear All (theme: '${theme}')`);
  });
});
test.afterEach(async ({ page }, testInfo) => {
  await scanForA11yViolations(page, testInfo.title);
});
