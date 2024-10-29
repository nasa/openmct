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
This test suite is dedicated to tests for renaming objects, and their global application effects.
*/

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, test } from '../../baseFixtures.js';

test.describe('Renaming objects', () => {
  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('When renaming objects, the browse bar and various components all update', async ({
    page
  }) => {
    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });
    // Create a new 'Clock' object with default settings
    const clock = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      parent: folder.uuid
    });

    // Rename
    clock.name = `${clock.name}-NEW!`;
    await renameObjectFromContextMenu(page, clock.url, clock.name);
    // check inspector for new name
    const titleValue = await page
      .getByLabel('Title inspector properties')
      .getByLabel('inspector property value')
      .textContent();
    expect(titleValue).toBe(clock.name);
    // check browse bar for new name
    await expect(page.locator(`.l-browse-bar >> text=${clock.name}`)).toBeVisible();
    // check tree item for new name
    await expect(
      page.getByRole('listitem', {
        name: clock.name
      })
    ).toBeVisible();
    // check recent objects for new name
    await expect(
      page.getByRole('navigation', {
        name: clock.name
      })
    ).toBeVisible();
    // check title for new name
    const title = await page.title();
    expect(title).toBe(clock.name);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 * @param {string} url
 * @param {string} newName
 */
async function renameObjectFromContextMenu(page, url, newName) {
  await openObjectTreeContextMenu(page, url);
  await page.locator('li:text("Edit Properties")').click();
  const nameInput = page.getByLabel('Title', { exact: true });
  await nameInput.fill('');
  await nameInput.fill(newName);
  await page.locator('[aria-label="Save"]').click();
}

/**
 * Open the given `domainObject`'s context menu from the object tree.
 * Expands the path to the object and scrolls to it if necessary.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url the url to the object
 */
async function openObjectTreeContextMenu(page, url) {
  await page.goto(url);
  await page.getByLabel('Show selected item in tree').click();
  await page.locator('.is-navigated-object').click({
    button: 'right'
  });
}
