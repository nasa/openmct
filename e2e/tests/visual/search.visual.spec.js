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

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

const percySnapshot = require('@percy/playwright');

test.describe('Grand Search', () => {
  let clock;
  let displayLayout;
  test.beforeEach(async ({ page, theme }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.getByTitle('Collapse Browse Pane').click();

    displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Visual Test Display Layout'
    });

    clock = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'Visual Test Clock',
      parent: displayLayout.uuid
    });
  });

  test('Can search for folder object, and subsequent search dropdown behaves properly', async ({
    page,
    theme
  }) => {
    const searchInput = page.getByRole('searchbox', { name: 'Search Input' });
    const searchResults = page.getByRole('searchbox', { name: 'OpenMCT Search' });
    // Navigate to display layout
    await page.goto(displayLayout.url);

    // Search for the clock object
    await searchInput.click();
    await searchInput.fill(clock.name);
    await expect(searchResults.getByText('Visual Test Clock')).toBeVisible();

    //Searching for an object returns that object in the grandsearch
    await percySnapshot(page, `Searching for Clock Object (theme: '${theme}')`);

    // Enter Edit mode on the Display Layout
    await page.getByRole('button', { name: 'Edit' }).click();

    // Navigate to the clock object while in edit mode on the display layout
    await searchInput.click();
    await searchResults.getByText('Visual Test Clock').click();

    await percySnapshot(
      page,
      `Preview for clock should display when editing enabled and search item clicked (theme: '${theme}')`
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

    // Search for the clock object
    await searchInput.click();
    await searchInput.fill(clock.name);
    await expect(searchResults.getByText('Visual Test Clock')).toBeVisible();

    // Navigate to the clock object while not in edit mode on the display layout
    await searchResults.getByText('Visual Test Clock').click();

    await percySnapshot(
      page,
      `Clicking on search results should navigate to them if not editing (theme: '${theme}')`
    );
  });
});
