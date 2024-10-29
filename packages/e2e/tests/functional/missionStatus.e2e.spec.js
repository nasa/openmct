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
  const NO_GO = '0';
  const GO = '1';
  test.beforeEach(async ({ page }) => {
    // FIXME: determine if plugins will be added to index.html or need to be injected
    await page.addInitScript({
      path: fileURLToPath(new URL('../../helper/addInitExampleUser.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Select Role')).toBeVisible();
    // Description should be empty https://github.com/nasa/openmct/issues/6978
    await expect(page.getByLabel('Dialog message')).toBeHidden();
    // set role
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    // dismiss role confirmation popup
    await page.getByRole('button', { name: 'Dismiss' }).click();
  });

  test('Basic functionality', async ({ page }) => {
    const imageryStatusSelect = page.getByRole('combobox', { name: 'Imagery' });
    const commandingStatusSelect = page.getByRole('combobox', { name: 'Commanding' });
    const drivingStatusSelect = page.getByRole('combobox', { name: 'Driving' });
    const missionStatusPanel = page.getByRole('dialog', { name: 'User Control Panel' });

    await test.step('Mission status panel shows/hides when toggled', async () => {
      // Ensure that clicking the button toggles the dialog
      await page.getByLabel('Toggle Mission Status Panel').click();
      await expect(missionStatusPanel).toBeVisible();
      await page.getByLabel('Toggle Mission Status Panel').click();
      await expect(missionStatusPanel).toBeHidden();
      await page.getByLabel('Toggle Mission Status Panel').click();
      await expect(missionStatusPanel).toBeVisible();

      // Ensure that clicking the close button closes the dialog
      await page.getByLabel('Close Mission Status Panel').click();
      await expect(missionStatusPanel).toBeHidden();
      await page.getByLabel('Toggle Mission Status Panel').click();
      await expect(missionStatusPanel).toBeVisible();

      // Ensure clicking off the dialog also closes it
      await page.getByLabel('My Items Grid View').click();
      await expect(missionStatusPanel).toBeHidden();
      await page.getByLabel('Toggle Mission Status Panel').click();
      await expect(missionStatusPanel).toBeVisible();
    });

    await test.step('Mission action statuses have correct defaults and can be set', async () => {
      await expect(imageryStatusSelect).toHaveValue(NO_GO);
      await expect(commandingStatusSelect).toHaveValue(NO_GO);
      await expect(drivingStatusSelect).toHaveValue(NO_GO);

      await setMissionStatus(page, 'Imagery', GO);
      await expect(imageryStatusSelect).toHaveValue(GO);
      await expect(commandingStatusSelect).toHaveValue(NO_GO);
      await expect(drivingStatusSelect).toHaveValue(NO_GO);

      await setMissionStatus(page, 'Commanding', GO);
      await expect(imageryStatusSelect).toHaveValue(GO);
      await expect(commandingStatusSelect).toHaveValue(GO);
      await expect(drivingStatusSelect).toHaveValue(NO_GO);

      await setMissionStatus(page, 'Driving', GO);
      await expect(imageryStatusSelect).toHaveValue(GO);
      await expect(commandingStatusSelect).toHaveValue(GO);
      await expect(drivingStatusSelect).toHaveValue(GO);

      await setMissionStatus(page, 'Imagery', NO_GO);
      await expect(imageryStatusSelect).toHaveValue(NO_GO);
      await expect(commandingStatusSelect).toHaveValue(GO);
      await expect(drivingStatusSelect).toHaveValue(GO);

      await setMissionStatus(page, 'Commanding', NO_GO);
      await expect(imageryStatusSelect).toHaveValue(NO_GO);
      await expect(commandingStatusSelect).toHaveValue(NO_GO);
      await expect(drivingStatusSelect).toHaveValue(GO);

      await setMissionStatus(page, 'Driving', NO_GO);
      await expect(imageryStatusSelect).toHaveValue(NO_GO);
      await expect(commandingStatusSelect).toHaveValue(NO_GO);
      await expect(drivingStatusSelect).toHaveValue(NO_GO);
    });
  });
});

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {'Commanding'|'Imagery'|'Driving'} action
 * @param {'0'|'1'} status
 */
async function setMissionStatus(page, action, status) {
  await page.getByRole('combobox', { name: action }).selectOption(status);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Successfully set mission status' })
  ).toBeVisible();
  await page.getByLabel('Dismiss').click();
}
