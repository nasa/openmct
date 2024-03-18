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
import { fileURLToPath } from 'url';

import { expect, scanForA11yViolations, test } from '../../avpFixtures.js';

test.describe('Mission Status Visual Tests @a11y', () => {
  const GO = '1';
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(new URL('../../helper/addInitExampleUser.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Select Role')).toBeVisible();
    // set role
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    // dismiss role confirmation popup
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.getByLabel('Collapse Inspect Pane').click();
    await page.getByLabel('Collapse Browse Pane').click();
  });
  test('Mission status panel', async ({ page, theme }) => {
    await page.getByLabel('Toggle Mission Status Panel').click();
    await expect(page.getByRole('dialog', { name: 'User Control Panel' })).toBeVisible();
    await percySnapshot(page, `Mission status panel w/ default statuses (theme: '${theme}')`);
    await page.getByRole('combobox', { name: 'Commanding' }).selectOption(GO);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Successfully set mission status' })
    ).toBeVisible();
    await page.getByLabel('Dismiss').click();
    await percySnapshot(page, `Mission status panel w/ non-default status (theme: '${theme}')`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
