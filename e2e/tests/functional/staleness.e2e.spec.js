/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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

import { fileURLToPath } from 'url';

import { createDomainObjectWithDefaults, navigateToObjectWithRealTime } from '../../appActions.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Staleness with Controlled Clock @clock', () => {
  test.describe('Using ExampleStalenessProvider in realtime mode', () => {
    let objectView;
    let stateGenerator;

    test.beforeEach(async ({ page }) => {
      objectView = page.getByLabel('Object View');

      await page.addInitScript({
        path: fileURLToPath(
          new URL('../../helper/addInitExampleStalenessProvider.js', import.meta.url)
        )
      });

      // Go to baseURL
      await page.goto('./', { waitUntil: 'domcontentloaded' });

      // Create a state generator object, since it can have sparse data
      stateGenerator = await createDomainObjectWithDefaults(page, {
        type: 'State Generator',
        name: 'Test State Generator'
      });

      await navigateToObjectWithRealTime(page, stateGenerator.url);
    });

    test('indicates when telemetry is stale and clears staleness when telemetry is not stale', async ({
      page
    }) => {
      // Wait until telemetry goes stale
      await page.evaluate(async (sg) => {
        const openmct = window.openmct;
        const domainObject = await openmct.objects.get(sg.uuid);
        return new Promise((resolve) => {
          openmct.telemetry.subscribeToStaleness(domainObject, (stalenessResponse) => {
            if (stalenessResponse.isStale) {
              resolve();
            }
          });
        });
      }, stateGenerator);

      // Verify that the object view has the is-stale class
      await expect(objectView).toHaveClass(/is-stale/);

      // Wait until telemetry goes fresh
      await page.evaluate(async (sg) => {
        const openmct = window.openmct;
        const domainObject = await openmct.objects.get(sg.uuid);
        return new Promise((resolve) => {
          openmct.telemetry.subscribeToStaleness(domainObject, (stalenessResponse) => {
            if (!stalenessResponse.isStale) {
              resolve();
            }
          });
        });
      }, stateGenerator);

      // Verify that the object view does not have the is-stale class
      await expect(objectView).not.toHaveClass(/is-stale/);
    });
  });
});
