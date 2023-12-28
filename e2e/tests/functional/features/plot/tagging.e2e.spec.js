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

/*
Tests to verify plot tagging functionality.
*/

const { test, expect } = require('../../../../pluginFixtures');
const {
  basicTagsTests,
  createTags,
  testTelemetryItem
} = require('../../../../helper/plotTagsUtils');
const {
  createDomainObjectWithDefaults,
  setRealTimeMode,
  setFixedTimeMode,
  waitForPlotsToRender
} = require('../../../../appActions');

test.describe('Plot Tagging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Tags work with Overlay Plots', async ({ page }) => {
    test.slow();
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6822'
    });

    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    const alphaSineWave = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Alpha Sine Wave',
      parent: overlayPlot.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.01'
      }
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Beta Sine Wave',
      parent: overlayPlot.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.02'
      }
    });

    await page.goto(overlayPlot.url);

    let canvas = page.locator('canvas').nth(1);

    // Switch to real-time mode
    // Adding tags should pause the plot
    await setRealTimeMode(page);

    await createTags({
      page,
      canvas
    });

    await setFixedTimeMode(page);

    await basicTagsTests(page);
    await testTelemetryItem(page, alphaSineWave);

    // set to real time mode
    await setRealTimeMode(page);

    // Search for Science Tag
    await page.getByRole('searchbox', { name: 'Search Input' });
    await page.getByRole('searchbox', { name: 'Search Input' }).fill('sc');

    // Click on the search object result
    await page.getByLabel('OpenMCT Search').getByText('Alpha Sine Wave').first().click();

    await waitForPlotsToRender(page);

    // expect plot to be paused
    await expect(page.getByTitle('Resume displaying real-time data')).toBeVisible();

    await setFixedTimeMode(page);
  });

  test('Tags work with Plot View of telemetry items', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.01'
      }
    });
    const canvas = page.locator('canvas').nth(1);
    await createTags({
      page,
      canvas
    });
    await basicTagsTests(page);
  });

  test('Tags work with Stacked Plots', async ({ page }) => {
    const stackedPlot = await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot'
    });

    const alphaSineWave = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Alpha Sine Wave',
      parent: stackedPlot.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.01'
      }
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Beta Sine Wave',
      parent: stackedPlot.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.02'
      }
    });

    await page.goto(stackedPlot.url);

    const canvas = page.locator('canvas').nth(1);

    await createTags({
      page,
      canvas,
      xEnd: 700,
      yEnd: 240
    });
    await basicTagsTests(page);
    await testTelemetryItem(page, alphaSineWave);
  });
});
