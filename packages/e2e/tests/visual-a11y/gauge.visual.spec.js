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
import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_FIXED_URL } from '../../constants.js';

test.describe('Visual - Gauges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Visual - Default Gauge', async ({ page, theme }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Default Gauge'
    });

    // Take a snapshot of the newly created Gauge object
    await percySnapshot(page, `Default Gauge (theme: '${theme}')`);
  });

  test('Visual - Needle Gauge with State Generator', async ({ page, theme }) => {
    const needleGauge = await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Needle Gauge'
    });

    //Modify the Gauge to be a Needle Gauge
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();
    await page.getByLabel('Gauge type', { exact: true }).selectOption('dial-needle');
    await page.getByText('Ok').click();

    //Add a State Generator to the Gauge
    await page.goto(needleGauge.url + '?hideTree=true&hideInspector=true', {
      waitUntil: 'domcontentloaded'
    });

    // Take a snapshot of the newly created Gauge object
    await percySnapshot(page, `Needle Gauge with no telemetry source (theme: '${theme}')`);

    //Add a State Generator to the Gauge. Note this requires that snapshots are taken within 5 seconds
    await page.getByLabel('Create', { exact: true }).click();
    await page.getByLabel('State Generator').click();
    await page.getByLabel('Modal Overlay').getByLabel('Navigate to Needle Gauge').click();
    await page.getByLabel('Save').click();

    //Add a State Generator to the Gauge
    await page.goto(needleGauge.url + '?hideTree=true&hideInspector=true', {
      waitUntil: 'domcontentloaded'
    });

    // Take a snapshot of the newly created Gauge object
    await percySnapshot(page, `Needle Gauge with State Generator (theme: '${theme}')`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
