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
    const objectViewSelector = '.c-object-view';
    const isStaleClass = 'is-stale';
    const staleSWG = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG',
      parent: 'mine',
      customParameters: {
        'label:has([aria-label="Provide Staleness Updates"]) > input': 'true'
      }
    });
    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Folder 1'
    });

    // Navigate to the stale object
    await navigateToObjectWithRealTime(page, staleSWG.url);

    // Wait for staleness to be updated
    await page.waitForSelector(`.${isStaleClass}`, { state: 'attached' });

    // Immediately navigate to the folder
    await page.goto(folder.url);

    // Verify that staleness is not shown
    const objectView = page.locator(objectViewSelector);
    const containsStaleClass = await objectView.evaluate((node, staleClass) => {
      return node.classList.contains(staleClass);
    }, isStaleClass);
    await expect(containsStaleClass).toBeFalsy();
  });
});
