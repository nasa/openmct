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
/* global __dirname */
const path = require('path');
const { test } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');

const utils = require('../../helper/faultUtils');

test.describe('The Fault Management Plugin Visual Test', () => {
  test('icon test', async ({ page, theme }) => {
    await page.addInitScript({
      path: path.join(__dirname, '../../helper/', 'addInitFaultManagementPlugin.js')
    });
    await page.goto('./', { waitUntil: 'networkidle' });

    await percySnapshot(page, `Fault Management icon appears in tree (theme: '${theme}')`);
  });

  test('fault list and acknowledged faults', async ({ page, theme }) => {
    await utils.navigateToFaultManagementWithStaticExample(page);

    await percySnapshot(page, `Shows a list of faults in the standard view (theme: '${theme}')`);

    await utils.acknowledgeFault(page, 1);
    await utils.changeViewTo(page, 'acknowledged');

    await percySnapshot(
      page,
      `Acknowledged faults, have a checkmark on the fault icon and appear in the acknowldeged view (theme: '${theme}')`
    );
  });

  test('shelved faults', async ({ page, theme }) => {
    await utils.navigateToFaultManagementWithStaticExample(page);

    await utils.shelveFault(page, 1);
    await utils.changeViewTo(page, 'shelved');

    await percySnapshot(page, `Shelved faults appear in the shelved view (theme: '${theme}')`);

    await utils.openFaultRowMenu(page, 1);

    await percySnapshot(
      page,
      `Shelved faults have a 3-dot menu with Unshelve option enabled (theme: '${theme}')`
    );
  });

  test('3-dot menu for fault', async ({ page, theme }) => {
    await utils.navigateToFaultManagementWithStaticExample(page);

    await utils.openFaultRowMenu(page, 1);

    await percySnapshot(
      page,
      `Faults have a 3-dot menu with Acknowledge, Shelve and Unshelve (Unshelve is disabled) options (theme: '${theme}')`
    );
  });

  test('ability to acknowledge or shelve', async ({ page, theme }) => {
    await utils.navigateToFaultManagementWithStaticExample(page);

    await utils.selectFaultItem(page, 1);

    await percySnapshot(
      page,
      `Selected faults highlight the ability to Acknowledge or Shelve above the fault list (theme: '${theme}')`
    );
  });
});
