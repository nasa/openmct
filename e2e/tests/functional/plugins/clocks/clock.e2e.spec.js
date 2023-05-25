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
This test suite is dedicated to tests which verify the basic operations surrounding Clock.
*/

const { test, expect } = require('../../../../baseFixtures');

test.describe('Clock Generator CRUD Operations', () => {
  test('Timezone dropdown will collapse when clicked outside or on dropdown icon again', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/4878'
    });
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click Clock
    await page.click('text=Clock');

    // Click .icon-arrow-down
    await page.locator('.icon-arrow-down').click();
    //verify if the autocomplete dropdown is visible
    await expect(page.locator('.c-input--autocomplete__options')).toBeVisible();
    // Click .icon-arrow-down
    await page.locator('.icon-arrow-down').click();

    // Verify clicking on the autocomplete arrow collapses the dropdown
    await expect(page.locator('.c-input--autocomplete__options')).toBeHidden();

    // Click timezone input to open dropdown
    await page.locator('.c-input--autocomplete__input').click();
    //verify if the autocomplete dropdown is visible
    await expect(page.locator('.c-input--autocomplete__options')).toBeVisible();

    // Verify clicking outside the autocomplete dropdown collapses it
    await page.locator('text=Timezone').click();
    // Verify clicking on the autocomplete arrow collapses the dropdown
    await expect(page.locator('.c-input--autocomplete__options')).toBeHidden();
  });
});
