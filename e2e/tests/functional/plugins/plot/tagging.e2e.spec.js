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
  createDomainObjectWithDefaults,
  setRealTimeMode,
  setFixedTimeMode,
  waitForPlotsToRender
} = require('../../../../appActions');

test.describe('Plot Tagging', () => {
  /**
   * Given a canvas and a set of points, tags the points on the canvas.
   * @param {import('@playwright/test').Page} page
   * @param {HTMLCanvasElement} canvas a telemetry item with a plot
   * @param {Number} xEnd a telemetry item with a plot
   * @param {Number} yEnd a telemetry item with a plot
   * @returns {Promise}
   */
  async function createTags({ page, canvas, xEnd, yEnd }) {
    await canvas.hover({ trial: true });

    //Alt+Shift Drag Start to select some points to tag
    await page.keyboard.down('Alt');
    await page.keyboard.down('Shift');

    await canvas.dragTo(canvas, {
      sourcePosition: {
        x: 1,
        y: 1
      },
      targetPosition: {
        x: xEnd,
        y: yEnd
      }
    });

    //Alt Drag End
    await page.keyboard.up('Alt');
    await page.keyboard.up('Shift');

    //Wait for canvas to stablize.
    await canvas.hover({ trial: true });

    // add some tags
    await page.getByText('Annotations').click();
    await page.getByRole('button', { name: /Add Tag/ }).click();
    await page.getByPlaceholder('Type to select tag').click();
    await page.getByText('Driving').click();

    await page.getByRole('button', { name: /Add Tag/ }).click();
    await page.getByPlaceholder('Type to select tag').click();
    await page.getByText('Science').click();
  }

  /**
   * Given a telemetry item (e.g., a Sine Wave Generator) with a plot, tests that the plot can be tagged.
   * @param {import('@playwright/test').Page} page
   * @param {import('../../../../appActions').CreatedObjectInfo} telemetryItem a telemetry item with a plot
   * @returns {Promise}
   */
  async function testTelemetryItem(page, telemetryItem) {
    // Check that telemetry item also received the tag
    await page.goto(telemetryItem.url);

    await expect(page.getByText('No tags to display for this item')).toBeVisible();

    const canvas = page.locator('canvas').nth(1);

    //Wait for canvas to stablize.
    await canvas.hover({ trial: true });

    // click on the tagged plot point
    await canvas.click({
      position: {
        x: 325,
        y: 377
      }
    });

    await expect(page.getByText('Science')).toBeVisible();
    await expect(page.getByText('Driving')).toBeHidden();
  }

  /**
   * Given a page, tests that tags are searchable, deletable, and persist across reloads.
   * @param {import('@playwright/test').Page} page
   * @returns {Promise}
   */
  async function basicTagsTests(page) {
    // Search for Driving
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();

    // Clicking elsewhere should cause annotation selection to be cleared
    await expect(page.getByText('No tags to display for this item')).toBeVisible();

    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('driv');
    // click on the search result
    await page
      .getByRole('searchbox', { name: 'OpenMCT Search' })
      .getByText(/Sine Wave/)
      .first()
      .click();

    // Delete Driving
    await page.hover('[aria-label="Tag"]:has-text("Driving")');
    await page.locator('[aria-label="Remove tag Driving"]').click();

    // Search for Science
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
    await expect(page.locator('[aria-label="Search Result"]').nth(0)).toContainText('Science');
    await expect(page.locator('[aria-label="Search Result"]').nth(0)).not.toContainText('Drilling');

    // Search for Driving
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('driv');
    await expect(page.getByText('No results found')).toBeVisible();

    //Reload Page
    await page.reload({ waitUntil: 'domcontentloaded' });
    // wait for plots to load
    await waitForPlotsToRender(page);

    await page.getByText('Annotations').click();
    await expect(page.getByText('No tags to display for this item')).toBeVisible();

    const canvas = page.locator('canvas').nth(1);
    // click on the tagged plot point
    await canvas.click({
      position: {
        x: 100,
        y: 100
      }
    });

    await expect(page.getByText('Science')).toBeVisible();
    await expect(page.getByText('Driving')).toBeHidden();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Tags work with Overlay Plots', async ({ page }) => {
    //Test.slow decorator is currently broken. Needs to be fixed in https://github.com/nasa/openmct/issues/5374
    test.slow();

    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    const alphaSineWave = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Alpha Sine Wave',
      parent: overlayPlot.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Beta Sine Wave',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);

    let canvas = page.locator('canvas').nth(1);

    // Switch to real-time mode
    // Adding tags should pause the plot
    await setRealTimeMode(page);

    await createTags({
      page,
      canvas,
      xEnd: 700,
      yEnd: 480
    });

    await setFixedTimeMode(page);

    await basicTagsTests(page);
    await testTelemetryItem(page, alphaSineWave);

    // set to real time mode
    await setRealTimeMode(page);

    // Search for Science
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('sc');
    // click on the search result
    await page
      .getByRole('searchbox', { name: 'OpenMCT Search' })
      .getByText('Alpha Sine Wave')
      .first()
      .click();
    // wait for plots to load
    await expect(page.locator('.js-series-data-loaded')).toBeVisible();
    // expect plot to be paused
    await expect(page.locator('[title="Resume displaying real-time data"]')).toBeVisible();

    await setFixedTimeMode(page);
  });

  test('Tags work with Plot View of telemetry items', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    const canvas = page.locator('canvas').nth(1);
    await createTags({
      page,
      canvas,
      xEnd: 700,
      yEnd: 480
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
      parent: stackedPlot.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Beta Sine Wave',
      parent: stackedPlot.uuid
    });

    await page.goto(stackedPlot.url);

    const canvas = page.locator('canvas').nth(1);

    await createTags({
      page,
      canvas,
      xEnd: 700,
      yEnd: 215
    });
    await basicTagsTests(page);
    await testTelemetryItem(page, alphaSineWave);
  });
});
