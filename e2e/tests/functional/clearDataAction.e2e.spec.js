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

/*
Verify that the "Clear Data" menu action performs as expected for various object types.
*/

const { test, expect } = require('../../pluginFixtures.js');
const { createDomainObjectWithDefaults } = require('../../appActions.js');

const backgroundImageSelector = '.c-imagery__main-image__background-image';

test.describe('Clear Data Action', () => {
  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a default 'Example Imagery' object
    const exampleImagery = await createDomainObjectWithDefaults(page, { type: 'Example Imagery' });

    // Verify that the created object is focused
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(exampleImagery.name);
    await page.locator('.c-imagery__main-image__bg').hover({ trial: true });
    await expect(page.locator(backgroundImageSelector)).toBeVisible();
  });
  test('works as expected with Example Imagery', async ({ page }) => {
    await expect(await page.locator('.c-thumb__image').count()).toBeGreaterThan(0);
    // Click the "Clear Data" menu action
    await page.getByTitle('More options').click();
    const clearDataMenuItem = page.getByRole('menuitem', {
      name: 'Clear Data'
    });
    await expect(clearDataMenuItem).toBeEnabled();
    await clearDataMenuItem.click();

    // Verify that the background image is no longer visible
    await expect(page.locator(backgroundImageSelector)).toBeHidden();
    await expect(await page.locator('.c-thumb__image').count()).toBe(0);
  });
});
