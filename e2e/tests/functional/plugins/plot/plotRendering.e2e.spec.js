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

/*
 * This test suite is dedicated to testing the rendering and interaction of plots.
 *
 */

import {
  createDomainObjectWithDefaults,
  createOutOfOrderStateTelemetry,
  getCanvasPixels,
  setEndOffset,
  setRealTimeMode,
  setStartOffset
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

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
    await page.getByLabel('Plot Canvas').hover();
  });

  test('Time conductor synchronizes with plot time range when that plot control is clicked', async ({
    page
  }) => {
    // Navigate to Sine Wave Generator
    await page.goto(sineWaveGeneratorObject.url);
    // Switch to real-time mode
    await setRealTimeMode(page);

    // hover over plot for plot controls
    await page.getByLabel('Plot Canvas').hover();
    // click on pause control
    await page.getByTitle('Pause incoming real-time data').click();

    // expect plot to be paused
    await expect(page.getByTitle('Resume displaying real-time data')).toBeVisible();

    // hover over plot for plot controls
    await page.getByLabel('Plot Canvas').hover();
    // click on synchronize with time conductor
    await page.getByTitle('Synchronize Time Conductor').click();

    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    //confirm that you're now in fixed mode with the correct range
    await expect(page.getByLabel('Time Conductor Mode')).toHaveText('Fixed Timespan');
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

test.describe('Visual - Plot rendering with out of order data @clock', () => {
  test('Out of Order data is rendered correctly - with no backward (golf club) interpolation @snapshot', async ({
    page
  }) => {
    await page.addInitScript(() => {
      window.glBuffers = [];
      const orgBufferData = WebGLRenderingContext.prototype.bufferData;

      WebGLRenderingContext.prototype.bufferData = function (target, data, usage) {
        if (data instanceof Float32Array && data.length > 10) {
          // Store the buffer so the test can inspect it
          window.glBuffers.push(Array.from(data));
        }
        return orgBufferData.call(this, target, data, usage);
      };
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const startOffset = {
      startMins: '00',
      startSecs: '10'
    };

    const endOffset = {
      endMins: '01',
      endSecs: '00'
    };

    await setRealTimeMode(page);
    await setStartOffset(page, startOffset);

    await setEndOffset(page, endOffset);

    await createOutOfOrderStateTelemetry(page);

    await page.getByText('OUT OF ORDER', { exact: true }).waitFor({ timeout: 10000 });
    // after out of order data is received, we need a couple more cycles for the plot to update
    const bufferCount = await page.evaluate(() => window.glBuffers.length);

    // This proves the renderer has cycled at least once since the data arrived
    await page.waitForFunction((oldLimit) => window.glBuffers.length > oldLimit + 60, bufferCount);

    // Inspect the Buffers
    const hasBackwardsLine = await page.evaluate(() => {
      return window.glBuffers.some((buffer) => {
        for (let i = 2; i < buffer.length; i += 2) {
          const currentX = buffer[i];
          const prevX = buffer[i - 2];
          // If current X is less than previous X, the line draws backward
          if (currentX < prevX && currentX !== 0 && prevX !== 0) {
            return true;
          }
        }
        return false;
      });
    });
    expect(hasBackwardsLine).toBe(false);
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
  await page.locator('[title="More actions"]').click();
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
