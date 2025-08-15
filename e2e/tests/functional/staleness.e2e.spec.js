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

import { createDomainObjectWithDefaults, navigateToObjectWithRealTime } from '../../appActions.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Staleness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Does not show staleness after navigating from a stale object', async ({ page }) => {
    const staleSWG = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG'
    });

    // edit properties and enable staleness updates
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit properties...').click();
    await page.getByLabel('Provide Staleness Updates', { exact: true }).click();
    await page.getByLabel('Save').click();

    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Folder 1'
    });

    // Navigate to the stale object
    await navigateToObjectWithRealTime(page, staleSWG.url);

    // Assert that staleness is shown
    await expect(page.getByLabel('Object View')).toHaveClass(/is-stale/, {
      timeout: 30 * 1000 // Give 30 seconds for the staleness to be updated
    });

    // Immediately navigate to the folder
    await page.goto(folder.url);

    // Verify that staleness is not shown
    await expect(page.getByLabel('Object View')).not.toHaveClass(/is-stale/);
  });
});
