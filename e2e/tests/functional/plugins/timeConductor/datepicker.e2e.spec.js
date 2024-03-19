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
  setIndependentTimeConductorBounds
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

const FIXED_TIME =
  './#/browse/mine?tc.mode=fixed&tc.startBound=1693592063607&tc.endBound=1693593893607&tc.timeSystem=utc&view=grid&hideInspector=true&hideTree=true';
test.describe('Datepicker operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXED_TIME);
  });
  test('Verify that user can use the datepicker in the TC', async ({ page }) => {
    await page.getByLabel('Time Conductor Mode').click();
    // Click on the date picker that is left-most on the screen
    await page.getByLabel('Global Time Conductor').locator('a').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Click on the first cell
    await page.getByText('27 239').click();
    // Expect datepicker to close and time conductor date setting to be changed
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
  test('Verify that user can use the datepicker in the ITC', async ({ page }) => {
    const createdTimeList = await createDomainObjectWithDefaults(page, { type: 'Time List' });

    await page.goto(createdTimeList.url, { waitUntil: 'domcontentloaded' });

    await setIndependentTimeConductorBounds(page, {
      start: '2024-11-12 19:11:11.000Z',
      end: '2024-11-12 20:11:11.000Z'
    });
    // Open ITC
    await page.getByLabel('Start bounds').nth(0).click();
    // Click on the datepicker icon
    await page.locator('form a').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Click on the first cell
    await page.getByText('7 342').click();
    // Expect datepicker to close and time conductor date setting to be changed
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
