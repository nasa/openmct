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

import {
  createDomainObjectWithDefaults,
  setRealTimeMode,
  subscribeToTelemetry
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Correlation Telemetry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const openmct = window.openmct;
      openmct.install(openmct.plugins.CorrelationTelemetry());
    });
  });

  test('will correlate telemetry from two objects based on timestamp', async ({ page }) => {
    const sineWaveGenerator1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator 1'
    });
    const sineWaveGenerator2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator 2'
    });

    // create correlation telemetry object, with x and y sources
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Correlation Telemetry' }).click();
    await page.getByLabel('Title', { exact: true }).fill('');
    await page.getByLabel('Title', { exact: true }).fill('Test Correlation Telemetry');

    // choose sine wave generator 1 as x source
    const createModalTreeFirst = page.getByLabel('Create Modal Tree').first();
    await createModalTreeFirst.getByLabel('Expand My Items folder').click();
    await createModalTreeFirst
      .getByLabel('Navigate to Sine Wave Generator 1 generator Object')
      .click();

    // choose sine wave generator 2 as y source
    const createModalTreeSecond = page.getByLabel('Create Modal Tree').nth(1);
    await createModalTreeSecond.getByLabel('Expand My Items folder').click();
    await createModalTreeSecond
      .getByLabel('Navigate to Sine Wave Generator 2 generator Object')
      .click();

    // save in my items folder
    const createModalTreeThird = page.getByLabel('Create Modal Tree').nth(2);
    await createModalTreeThird.getByLabel('Navigate to My Items folder').click();
    await page.getByRole('button', { name: 'Save' }).click();

    await setRealTimeMode(page);

    await page.getByLabel('Open the View Switcher Menu').click();
    await page.getByLabel('Telemetry Table').click();

    const getSWG1ValuePromise = subscribeToTelemetry(page, sineWaveGenerator1.uuid, false);
    const getSWG2ValuePromise = subscribeToTelemetry(page, sineWaveGenerator2.uuid, false);

    const swg1Value = await getSWG1ValuePromise;
    const swg2Value = await getSWG2ValuePromise;
    const correlatedTelemetryObject = {
      x: swg1Value.sin,
      y: swg2Value.sin,
      formattedTimestamp: swg1Value.formattedTimestamp,
      timestampsMatch: swg1Value.utc === swg2Value.utc
    };

    // wait for correlated telemetry object formatted timestamp to be visible in the telemetry table
    await expect(page.getByText(correlatedTelemetryObject.formattedTimestamp)).toBeVisible();

    // check that the x and y values are correlated in the same row, based on column names: x and y, respectively
    const telemetryTableRows = page.getByRole('row');
    const correlatedRow = telemetryTableRows.filter((row) =>
      row.getByText(correlatedTelemetryObject.formattedTimestamp).isVisible()
    );
    await expect(
      correlatedRow.getByLabel(`x table cell ${correlatedTelemetryObject.x}`).first()
    ).toBeVisible();
    await expect(
      correlatedRow.getByLabel(`y table cell ${correlatedTelemetryObject.y}`).first()
    ).toBeVisible();
  });
});
