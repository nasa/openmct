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

import { expect, test } from '../../baseFixtures.js';

test.describe('Create Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('is filterable', async ({ page }) => {
    // open create menu
    await page.getByRole('button', { name: 'Create' }).click();

    // filter create menu
    await page.getByRole('textbox', { name: 'Filter' }).fill('Condition Set');

    // verify only one item is visible
    await expect(page.getByRole('menuitem')).toHaveCount(1);
    await expect(page.getByRole('menuitem', { name: 'Condition Set' })).toBeVisible();
  });

  test('is able to be closed with Escape', async ({ page }) => {
    // open create menu
    await page.getByRole('button', { name: 'Create' }).click();

    // verify create menu is open and has more than 1 item
    const menuItems = await page.getByRole('menuitem').count();
    expect(menuItems).toBeGreaterThan(0);

    // close create menu
    await page.keyboard.press('Escape');

    // verify create menu is closed
    await expect(page.getByRole('menuitem')).toHaveCount(0);
  });

  test('if filtered to one item, Enter will simulate a click', async ({ page }) => {
    // open create menu
    await page.getByRole('button', { name: 'Create' }).click();

    // filter create menu
    await page.getByRole('textbox', { name: 'Filter' }).fill('Condition Set');

    // verify only one item is visible
    await expect(page.getByRole('menuitem')).toHaveCount(1);
    await expect(page.getByRole('menuitem', { name: 'Condition Set' })).toBeVisible();

    // press Enter
    await page.keyboard.press('Enter');
    await page.getByLabel('Save').click();

    // verify create menu is closed
    await expect(page.getByRole('menuitem')).toHaveCount(0);

    // open the tree and verify the condition set is created
    await page.getByLabel('Expand My Items folder').click();
    await expect(page.getByRole('treeitem', { name: 'Condition Set' })).toBeVisible();
  });
});
