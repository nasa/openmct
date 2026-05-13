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
This test suite is dedicated to tests which verify create menu functionality
*/

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, test } from '../../baseFixtures.js';

test.describe('Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('overlay with buttons, Enter and Escape will simulate "Ok" and "Cancel"', async ({
    page
  }) => {
    // Create a new 'Clock' object with default settings
    await createDomainObjectWithDefaults(page, {
      name: 'Clock',
      type: 'Clock'
    });

    // open my items folder
    await page.getByRole('button', { name: 'Expand My Items folder' }).click();

    // context menu click clock and select remove
    await page.getByRole('treeitem', { name: 'Clock' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Remove' }).click();

    // verify remove dialog is open
    await expect(page.getByLabel('Modal Overlay')).toBeVisible();

    // press escape
    await page.keyboard.press('Escape');

    // verify remove dialog is closed
    await expect(page.getByLabel('Modal Overlay')).toBeHidden();

    // context menu click clock and select remove
    await page.getByRole('treeitem', { name: 'Clock' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Remove' }).click();

    // verify remove dialog is open
    await expect(page.getByLabel('Modal Overlay')).toBeVisible();

    // press enter
    await page.keyboard.press('Enter');

    // verify remove dialog is closed
    await expect(page.getByLabel('Modal Overlay')).toBeHidden();

    // verify clock is removed
    await expect(page.getByRole('treeitem', { name: 'Clock' })).toBeHidden();
  });
});
