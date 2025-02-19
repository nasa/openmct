/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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
import { expect, test } from '../../pluginFixtures.js';

test.describe('Create button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('plugins can be selected', async ({ page }) => {
    await page.goto('./#/browse/mine');

    //verify clicking the Create button will both open AND close the Create menu
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByLabel('Select Plugins...')).toBeVisible();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByLabel('Select Plugins...')).toBeHidden();

    //verify plugin selector form is visible
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('menuitem', { name: 'Clock' })).toBeVisible();
    await page.getByLabel('Select Plugins...').click();
    await expect(page.locator('.js-form-title')).toContainText('Plugin Selector');
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    //disable clock plugin
    await expect(page.locator('.plugin-selector-row').first()).toContainText('Clock');
    await expect(page.getByLabel('Clock plugin checkbox')).toBeChecked();
    await expect(page.getByLabel('Clock plugin checkbox')).toBeEnabled();
    await page.getByLabel('Clock plugin checkbox').uncheck();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.js-form-title')).toBeHidden();

    //verify Clock plugin option is no longer in Create menu
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('menuitem', { name: 'Clock' })).toBeHidden();

    //re-enable clock plugin
    await page.getByLabel('Select Plugins...').click();
    await expect(page.locator('.js-form-title')).toContainText('Plugin Selector');
    await expect(page.getByLabel('Clock plugin checkbox')).not.toBeChecked();
    await expect(page.getByLabel('Clock plugin checkbox')).toBeEnabled();
    await page.getByLabel('Clock plugin checkbox').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.js-form-title')).toBeHidden();

    //verify Clock plugin option appears in Create menu
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('menuitem', { name: 'Clock' })).toBeVisible();

    //activate clock plugin
    await page.getByRole('menuitem', { name: 'Clock' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    //verify the active clock plugin cannot be disabled while in-use
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByLabel('Select Plugins...').click();
    await expect(page.locator('.plugin-selector-row').first()).toContainText('Clock');
    await expect(page.getByLabel('Clock plugin checkbox')).toBeChecked();
    await expect(page.getByLabel('Clock plugin checkbox')).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel' }).click();

    //remove active clock plugin
    await page.getByLabel('Expand My Items folder').click();
    await page.getByLabel('Navigate to Unnamed Clock clock Object').click({
      button: 'right'
    });
    await page.getByLabel('Remove').click();
    await expect(
      page.getByText(
        'Warning! This action will remove this object. Are you sure you want to continue?'
      )
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    //verify the active clock plugin can be disabled since the plugin is no longer in-use
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByLabel('Select Plugins...').click();
    await expect(page.locator('.plugin-selector-row').first()).toContainText('Clock');
    await expect(page.getByLabel('Clock plugin checkbox')).toBeChecked();
    await expect(page.getByLabel('Clock plugin checkbox')).toBeEnabled();
  });
});
