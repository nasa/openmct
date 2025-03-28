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

import { createDomainObjectWithDefaults, setRealTimeMode } from '../../../appActions.js';
import { MISSION_TIME } from '../../../constants.js';
import { expect, test } from '../../../pluginFixtures.js';

const TELEMETRY_RATE = 2500;

test.describe('Example Event Generator Acknowledge with Controlled Clock @clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await setRealTimeMode(page);

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator with Acknowledge'
    });
  });

  test('Rows are updatable in place', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7938'
    });

    await test.step('First telemetry datum gets added as new row', async () => {
      await page.clock.fastForward(TELEMETRY_RATE);
      const rows = page.getByLabel('table content').getByLabel('Table Row');
      const acknowledgeCell = rows.first().getByLabel('acknowledge table cell');

      await expect(rows).toHaveCount(1);
      await expect(acknowledgeCell).not.toHaveAttribute('title', 'OK');
    });

    await test.step('Incoming Telemetry datum matching an existing rows in place update key has data merged to existing row', async () => {
      await page.clock.fastForward(TELEMETRY_RATE * 2);
      const rows = page.getByLabel('table content').getByLabel('Table Row');
      const acknowledgeCell = rows.first().getByLabel('acknowledge table cell');

      await expect(rows).toHaveCount(1);
      await expect(acknowledgeCell).toHaveAttribute('title', 'OK');
    });
  });
});
