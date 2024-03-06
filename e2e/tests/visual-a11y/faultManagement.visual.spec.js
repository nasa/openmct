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
import percySnapshot from '@percy/playwright';

import {
  acknowledgeFault,
  changeViewTo,
  navigateToFaultManagementWithoutExample,
  navigateToFaultManagementWithStaticExample,
  openFaultRowMenu,
  selectFaultItem,
  shelveFault
} from '../../helper/faultUtils.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Fault Management Visual Tests - without example', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithoutExample(page);
    await page.getByLabel('Collapse Inspect Pane').click();
    await page.getByLabel('Click to collapse items').click();
  });

  test('fault management icon appears in tree', async ({ page, theme }) => {
    // Wait for status bar to load
    await expect(
      page.getByRole('status', {
        name: 'Clock Indicator'
      })
    ).toBeInViewport();
    await expect(
      page.getByRole('status', {
        name: 'Global Clear Indicator'
      })
    ).toBeInViewport();
    await expect(
      page.getByRole('status', {
        name: 'Snapshot Indicator'
      })
    ).toBeInViewport();

    await percySnapshot(page, `Fault Management icon appears in tree (theme: '${theme}')`);
  });
});

test.describe('Fault Management Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithStaticExample(page);
    await page.getByLabel('Collapse Inspect Pane').click();
    await page.getByLabel('Click to collapse items').click();
  });

  test('fault list and acknowledged faults', async ({ page, theme }) => {
    await percySnapshot(page, `Shows a list of faults in the standard view (theme: '${theme}')`);

    await acknowledgeFault(page, 1);
    await changeViewTo(page, 'acknowledged');

    await percySnapshot(
      page,
      `Acknowledged faults, have a checkmark on the fault icon and appear in the acknowledged view (theme: '${theme}')`
    );
  });

  test('shelved faults', async ({ page, theme }) => {
    await shelveFault(page, 1);
    await changeViewTo(page, 'shelved');

    await percySnapshot(page, `Shelved faults appear in the shelved view (theme: '${theme}')`);

    await openFaultRowMenu(page, 1);

    await percySnapshot(
      page,
      `Shelved faults have a 3-dot menu with Unshelve option enabled (theme: '${theme}')`
    );
  });

  test('3-dot menu for fault', async ({ page, theme }) => {
    await openFaultRowMenu(page, 1);

    await percySnapshot(
      page,
      `Faults have a 3-dot menu with Acknowledge, Shelve and Unshelve (Unshelve is disabled) options (theme: '${theme}')`
    );
  });

  test('ability to acknowledge or shelve', async ({ page, theme }) => {
    await selectFaultItem(page, 1);

    await percySnapshot(
      page,
      `Selected faults highlight the ability to Acknowledge or Shelve above the fault list (theme: '${theme}')`
    );
  });
});
