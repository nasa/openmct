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
This test suite is dedicated to tests which can quickly verify that any openmct installation is
operable and that any type of testing can proceed.

Ideally, smoke tests should make zero assumptions about how and where they are run. This makes them
more resilient to change and therefor a better indicator of failure. Smoke tests will also run quickly
as they cover a very "thin surface" of functionality.

When deciding between authoring new smoke tests or functional tests, ask yourself "would I feel
comfortable running this test during a live mission?" Avoid creating or deleting Domain Objects.
Make no assumptions about the order that elements appear in the DOM.
*/

import { expect, test } from '../../pluginFixtures.js';

test.describe('Smoke tests for @mobile', () => {
  test.beforeEach(async ({ page }) => {
    //For now, this test is going to be hardcoded against './test-data/display_layout_with_child_layouts.json'
    await page.goto('./');
  });

  test('Verify that My Items Tree appears @mobile', async ({ page }) => {
    //My Items to be visible
    await expect(page.getByRole('treeitem', { name: 'My Items' })).toBeVisible();
  });

  test('Verify that user can search @mobile', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByRole('searchbox', { name: 'Search Input' }).fill('Parent Display Layout');
    //Search Results appear in search modal
    await expect(
      page.getByLabel('Object Results').getByText('Parent Display Layout')
    ).toBeVisible();
    //Clicking on the search result takes you to the object
    await page.getByLabel('Object Results').getByText('Parent Display Layout').click();
    await page.getByTitle('Collapse Browse Pane').click();
    await expect(page.getByRole('main').getByText('Parent Display Layout')).toBeVisible();
  });

  test('Verify that user can change time conductor @mobile', async ({ page }) => {
    //Collapse Browse Pane to get more Time Conductor space
    await page.getByLabel('Collapse Browse Pane').click();
    //Open Time Conductor and change to Real Time Mode and set offset hour by 1 hour
    // Disabling line because we're intentionally obscuring the text
    // eslint-disable-next-line playwright/no-force-option
    await page.getByLabel('Time Conductor Mode').click({ force: true });
    await page.getByLabel('Time Conductor Mode Menu').click();
    await page.getByLabel('Real-Time').click();
    await page.getByLabel('Start offset hours').fill('01');
    await page.getByLabel('Submit time offsets').click();
    await expect(page.getByLabel('Start offset: 01:30:00')).toBeVisible();
  });

  test('Remove Object and confirmation dialog @mobile', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByRole('searchbox', { name: 'Search Input' }).fill('Parent Display Layout');
    //Search Results appear in search modal
    //Clicking on the search result takes you to the object
    await page.getByLabel('Object Results').getByText('Parent Display Layout').click();
    await page.getByTitle('Collapse Browse Pane').click();
    await expect(page.getByRole('main').getByText('Parent Display Layout')).toBeVisible();
    //Verify both objects are in view
    await expect(await page.getByLabel('Child Layout 1 Layout')).toBeVisible();
    await expect(await page.getByLabel('Child Layout 2 Layout')).toBeVisible();
    //Remove First Object to bring up confirmation dialog
    await page.getByLabel('View menu items').nth(1).click();
    await page.getByLabel('Remove').click();
    await page.getByRole('button', { name: 'OK' }).click();
    //Verify that the object is removed
    await expect(await page.getByLabel('Child Layout 1 Layout')).toBeVisible();
    expect(await page.getByLabel('Child Layout 2 Layout').count()).toBe(0);
  });
});
