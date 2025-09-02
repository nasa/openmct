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

/**
 * This test is dedicated to test styling changes in the inspector tool
 */

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Style Inspector Options', () => {
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a Flexible Layout and attach to the Stacked Plot
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Flexible Layout'
    });
    // Create a Stacked Plot and attach to the Flexible Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'Stacked Plot',
      parent: flexibleLayout.uuid
    });
  });

  test('styles button only appears when appropriate component selected', async ({ page }) => {
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();

    // Select flexible layout column
    await page.getByLabel('Container Handle 1').click();

    // Flex Layout containers should NOT be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeHidden();

    // Select Flex Layout Column
    await page.getByLabel('Flexible Layout Column').click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();

    // Select Stacked Layout Column
    await page.getByRole('group', { name: 'Stacked Plot Frame' }).click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();
  });
});

test.describe('Saved Styles', () => {
  test.fixme('historical styles appear as an option once used', async ({ page }) => {
    //test
  });
  test.fixme('at least 5 saved styles appear in the saved styles list', async ({ page }) => {
    //test
  });
  test.fixme('Saved Styles can be deleted once used', async ({ page }) => {
    //test
  });
  test.fixme('can apply a saved style to the currently selected target', async ({ page }) => {
    //test
  });
});
