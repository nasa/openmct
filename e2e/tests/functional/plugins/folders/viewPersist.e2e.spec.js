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

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Folder View Persistence', () => {
  let folder;
  let sineWaveGenerator;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a folder
    folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    // Create a sine wave generator inside the folder
    sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: folder.uuid
    });

    // Navigate to the folder
    await page.goto(folder.url);
  });

  test('Folder view persists when navigating away and back', async ({ page }) => {
    // Click the view switcher button to open the menu
    await page.getByLabel('Open the View Switcher Menu').click();

    // Click the List View option from the dropdown menu
    await page.getByRole('menuitem', { name: /List View/ }).click();

    // Verify that we're now in List view by checking for the c-list-view class
    await expect(page.locator('.c-list-view')).toBeVisible();

    // Navigate to the sine wave generator
    await page.goto(sineWaveGenerator.url);

    // Verify we're on the sine wave generator page by checking for the object view container
    await expect(page.locator('.c-object-view.is-object-type-generator')).toBeVisible();

    // Navigate back to the folder
    await page.goto(folder.url);

    // Verify that the folder is still in List view
    await expect(page.locator('.c-list-view')).toBeVisible();
  });
});
