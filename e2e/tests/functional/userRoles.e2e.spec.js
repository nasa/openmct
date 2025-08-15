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

import { fileURLToPath } from 'url';

import { expect, test } from '../../pluginFixtures.js';

test.describe('User Roles', () => {
  test('Role prompting', async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(new URL('../../helper/addInitExampleUser.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // we have multiple available roles, so it should prompt the user
    await expect(page.getByText('Select Role')).toBeVisible();
    await page.getByRole('combobox').selectOption('driver');
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(page.getByLabel('User Role')).toContainText('driver');

    // attempt changing the role to another valid available role
    await page.getByRole('button', { name: 'Change Role' }).click();
    await page.getByRole('combobox').selectOption('flight');
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(page.getByLabel('User Role')).toContainText('flight');

    // reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    // should still be logged in as flight, and tell the user as much
    await expect(page.getByLabel('User Role')).toContainText('flight');
    await expect(page.getByText("You're logged in as role flight")).toBeVisible();

    // change active role in local storage to "apple_role", a bogus role not in the list of available roles
    await page.evaluate(() => {
      const openmct = window.openmct;
      openmct.user.setActiveRole('apple_role');
    });

    // reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // verify that role is prompted
    await expect(page.getByText('Select Role')).toBeVisible();

    // select real role of "driver"
    await page.getByRole('combobox').selectOption('driver');
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(page.getByLabel('User Role')).toContainText('driver');
  });
});
