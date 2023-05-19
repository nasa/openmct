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

const { expect, test } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Visual - LAD Table', () => {
  /** @type {import('@playwright/test').Locator} */
  let ladTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create LAD Table
    ladTable = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'LAD Table Test'
    });
    // Create SWG inside of LAD Table
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG4LAD Table Test',
      parent: ladTable.uuid
    });

    //Modify SWG to create a really stable SWG
    await page.locator('button[title="More options"]').click();

    await page.getByRole('menuitem', { name: ' Edit Properties...' }).click();

    //Forgive me, padre
    await page.getByRole('spinbutton', { name: 'Data Rate (hz)' }).fill('0');
    await page.getByRole('spinbutton', { name: 'Period' }).fill('0');

    await page.getByRole('button', { name: 'Save' }).click();
  });
  test('Toggled column widths behave accordingly', async ({ page, theme }) => {
    await page.goto(ladTable.url);
    //Close panes for visual consistency
    await page.getByTitle('Collapse Inspect Pane').click();
    await page.getByTitle('Collapse Browse Pane').click();

    await expect(page.locator('button[title="Expand Columns"]')).toBeVisible();

    await percySnapshot(
      page,
      `LAD Table w/ Sine Wave Generator columns autosized (theme: ${theme})`
    );

    await page.locator('button[title="Expand Columns"]').click();

    await expect(page.locator('button[title="Autosize Columns"]')).toBeVisible();

    await percySnapshot(
      page,
      `LAD Table w/ Sine Wave Generator columns expanded (theme: ${theme})`
    );
  });
});
