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

const {
  createDomainObjectWithDefaults,
  setTimeConductorBounds
} = require('../../../../appActions');
const { test, expect } = require('../../../../pluginFixtures');

test.describe('Telemetry Table', () => {
  test('unpauses and filters data when paused by button and user changes bounds', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5113'
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const table = await createDomainObjectWithDefaults(page, { type: 'Telemetry Table' });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    page.goto(table.url);

    // Click pause button
    const pauseButton = page.locator('button.c-button.icon-pause');
    await pauseButton.click();

    const tableWrapper = page.locator('div.c-table-wrapper');
    await expect(tableWrapper).toHaveClass(/is-paused/);

    // Subtract 5 minutes from the current end bound datetime and set it
    // Bring up the time conductor popup
    let endDate = await page.locator('[aria-label="End bounds"]').textContent();
    endDate = new Date(endDate);

    endDate.setUTCMinutes(endDate.getUTCMinutes() - 5);
    endDate = endDate.toISOString().replace(/T/, ' ');

    await setTimeConductorBounds(page, undefined, endDate);

    await expect(tableWrapper).not.toHaveClass(/is-paused/);

    // Get the most recent telemetry date
    const latestTelemetryDate = await page
      .locator('table.c-telemetry-table__body > tbody > tr')
      .last()
      .locator('td')
      .nth(1)
      .getAttribute('title');

    // Verify that it is <= our new end bound
    const latestMilliseconds = Date.parse(latestTelemetryDate);
    const endBoundMilliseconds = Date.parse(endDate);
    expect(latestMilliseconds).toBeLessThanOrEqual(endBoundMilliseconds);
  });
});
