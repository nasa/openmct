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
This test suite is dedicated to tests which verify search functionality.
*/

const { test, expect, scanForA11yViolations } = require('../../avpFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const { VISUAL_URL } = require('../../constants');

const percySnapshot = require('@percy/playwright');

test.describe('Grand Search @a11y', () => {
  let conditionWidget;
  let displayLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });

    displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Visual Test Display Layout'
    });

    conditionWidget = await createDomainObjectWithDefaults(page, {
      type: 'Condition Widget',
      name: 'Visual Condition Widget',
      parent: displayLayout.uuid
    });
  });

  test('Can search for folder object, and subsequent search dropdown behaves properly', async ({
    page,
    theme
  }) => {
    // Navigate to display layout
    await page.goto(displayLayout.url);

    // Search for the object
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByRole('searchbox', { name: 'Search Input' }).fill(conditionWidget.name);
    await expect(page.getByLabel('Search Result').getByText(conditionWidget.name)).toBeVisible();

    //Searching for an object returns that object in the grandsearch
    await percySnapshot(page, `Searching for Object (theme: '${theme}')`);

    // Enter Edit mode on the Display Layout
    await page.getByRole('button', { name: 'Edit' }).click();

    // Navigate to the object while in edit mode on the display layout
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByLabel('Search Result').getByText(conditionWidget.name).click();

    await percySnapshot(
      page,
      `Preview should display when editing enabled and search item clicked (theme: '${theme}')`
    );

    // Close the preview
    await page.getByRole('button', { name: 'Close' }).click();
    await percySnapshot(
      page,
      `Search should still be showing after preview closed (theme: '${theme}')`
    );

    // Save and finish editing the Display Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Search for the object
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByRole('searchbox', { name: 'Search Input' }).fill(conditionWidget.name);
    await expect(page.getByLabel('Search Result').getByText(conditionWidget.name)).toBeVisible();

    // Navigate to the object while not in edit mode on the display layout
    await page.getByLabel('Search Result').getByText(conditionWidget.name).click();

    await percySnapshot(
      page,
      `Clicking on search results should navigate to them if not editing (theme: '${theme}')`
    );
  });
  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
