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
 * This test suite is dedicated to testing the rendering and interaction of plots.
 *
 */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults, getCanvasPixels } = require('../../../../appActions');

test.describe('Plot Rendering', () => {
  let sineWaveGeneratorObject;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    sineWaveGeneratorObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });
  });

  test('Plots do not re-request data when a plot is clicked', async ({ page }) => {
    // Navigate to Sine Wave Generator
    await page.goto(sineWaveGeneratorObject.url);
    // Click on the plot canvas
    await page.locator('canvas').nth(1).click();
    // No request was made to get historical data
    const createMineFolderRequests = [];
    page.on('request', (req) => {
      createMineFolderRequests.push(req);
    });
    expect(createMineFolderRequests.length).toEqual(0);
  });

  test('Plot is rendered when infinity values exist', async ({ page }) => {
    // Edit Plot
    await editSineWaveToUseInfinityOption(page, sineWaveGeneratorObject);

    //Get pixel data from Canvas
    const plotPixels = await getCanvasPixels(page, 'canvas');
    const plotPixelSize = plotPixels.length;
    expect(plotPixelSize).toBeGreaterThan(0);
  });
});

/**
 * This function edits a sine wave generator with the default options and enables the infinity values option.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../../appActions').CreateObjectInfo} sineWaveGeneratorObject
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the edited domain object.
 */
async function editSineWaveToUseInfinityOption(page, sineWaveGeneratorObject) {
  await page.goto(sineWaveGeneratorObject.url);
  // Edit SWG properties to include infinity values
  await page.locator('[title="More options"]').click();
  await page.locator('[title="Edit properties of this object."]').click();
  await page
    .getByRole('switch', {
      name: 'Include Infinity Values'
    })
    .check();

  await page
    .getByRole('button', {
      name: 'Save'
    })
    .click();

  // FIXME: Changes to SWG properties should be reflected on save, but they're not?
  // Thus, navigate away and back to the object.
  await page.goto('./#/browse/mine');
  await page.goto(sineWaveGeneratorObject.url);
}
