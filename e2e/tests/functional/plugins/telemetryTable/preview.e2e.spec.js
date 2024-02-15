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
 * This test suite is dedicated to testing the preview plugin.
 */

import { createDomainObjectWithDefaults, expandEntireTree } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Preview mode', () => {
  test('all context menu items are available for a telemetry table', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create a Display Layout
    const displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });
    // Create a Telemetry Table
    const telemetryTable = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      parent: displayLayout.uuid
    });
    // Create a Sinewave Generator
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: telemetryTable.uuid
    });

    await page.goto(displayLayout.url);
    await page.getByLabel('View menu items').click();
    await expect(page.getByLabel('Export Marked Rows')).toBeVisible();

    await page.getByRole('menuitem', { name: 'Large View' }).click();
    await page.getByLabel('Overlay').getByLabel('More actions').click();
    await expect(page.getByLabel('Export Table Data')).toBeVisible();
    await expect(page.getByLabel('Export Marked Rows')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Pause' }).click();
    await page.getByLabel('Close').click();

    await expandEntireTree(page);

    await page.getByLabel('Edit Object').click();

    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const telemetryTableTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(telemetryTable.name)
    });
    await telemetryTableTreeItem.locator('a').click();
    await page.getByLabel('Overlay').getByLabel('More actions').click();
    await expect(page.getByLabel('Export Table Data')).toBeVisible();
    await expect(page.getByLabel('Export Marked Rows')).toBeVisible();
  });
});
