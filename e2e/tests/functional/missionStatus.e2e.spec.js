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
This test suite is dedicated to tests which verify persistability checks
*/

import { fileURLToPath } from 'url';

import { expect, test } from '../../baseFixtures.js';

test.describe('Mission Status @addInit', () => {
  test.beforeEach(async ({ page }) => {
    // FIXME: determine if plugins will be added to index.html or need to be injected
    await page.addInitScript({
      path: fileURLToPath(new URL('../../helper/addInitExampleUser.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Select Role')).toBeVisible();
    // Description should be empty https://github.com/nasa/openmct/issues/6978
    await expect(page.locator('.c-message__action-text')).toBeHidden();
    // set role
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    // dismiss role confirmation popup
    await page.getByRole('button', { name: 'Dismiss' }).click();
  });

  test('Mission Status is visible and expands when clicked', async ({ page }) => {
    const imageryStatusSelect = page.getByRole('combobox', { name: 'Imagery' });
    const commandingStatusSelect = page.getByRole('combobox', { name: 'Commanding' });
    const drivingStatusSelect = page.getByRole('combobox', { name: 'Driving' });


    await page.getByLabel('Toggle Mission Status Panel').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect(imageryStatusSelect).toHaveValue('NO GO');
    await expect(commandingStatusSelect).toHaveValue('NO GO');
    await expect(drivingStatusSelect).toHaveValue('NO GO');

    await page.getByRole('combobox', { name: 'Imagery' }).selectOption('GO');
    await expect(imageryStatusSelect).toHaveValue('GO');
    await expect(commandingStatusSelect).toHaveValue('NO GO');
    await expect(drivingStatusSelect).toHaveValue('NO GO');
    await expect(
      page.getByRole('alert').filter({ hasText: 'Successfully set mission status' })
    ).toBeVisible();
  });
});
