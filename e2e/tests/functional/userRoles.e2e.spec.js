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
  test.beforeEach(async ({ page }) => {
    // FIXME: determine if plugins will be added to index.html or need to be injected
    await page.addInitScript({
      path: fileURLToPath(new URL('../../helper/addInitExampleUser.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  // verify that operator status is visible
  test('Role prompting', async ({ page }) => {
    await expect(page.getByText('Select Role')).toBeVisible();
    await page.getByRole('combobox').selectOption('driver');
    await page.getByRole('button', { name: 'Select' }).click();
    await expect(page.getByLabel('User Role')).toContainText('driver');

    await page.getByRole('button', { name: 'Change Role' }).click();
    await page.getByRole('combobox').selectOption('flight');
    await page.getByRole('button', { name: 'Select' }).click();
    await expect(page.getByLabel('User Role')).toContainText('flight');
  });
});
