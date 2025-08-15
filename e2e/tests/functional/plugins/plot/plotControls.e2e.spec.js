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
  getCanvasPixels,
  setEndOffset,
  setRealTimeMode,
  setStartOffset
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Plot Controls', () => {
  let overlayPlot;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    // Create an overlay plot with a sine wave generator
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    await page.goto(`${overlayPlot.url}`);
  });

  test("Plots don't purge data when paused", async ({ page }) => {
    // Set realtime mode with 2 second window
    const startOffset = {
      startMins: '00',
      startSecs: '01'
    };

    const endOffset = {
      endMins: '00',
      endSecs: '01'
    };

    // Switch to real-time mode
    await setRealTimeMode(page);

    // Set start time offset
    await setStartOffset(page, startOffset);

    // Set end time offset
    await setEndOffset(page, endOffset);
    // Edit the overlay plot and turn off auto scale, setting the min and max to -1 and 1
    // enter edit mode
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Config' }).click();

    // turn off autoscale
    await page.getByRole('checkbox', { name: 'Auto scale' }).uncheck();

    await page.getByLabel('Y Axis 1 Minimum value').fill('-1');
    await page.getByLabel('Y Axis 1 Maximum value').fill('1');

    // save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    // hover over plot for plot controls
    await page.getByLabel('Plot Canvas').hover();
    // click on pause control
    await page.getByTitle('Pause incoming real-time data').click();
    // expect plot to be paused
    await expect(page.getByTitle('Resume displaying real-time data')).toBeVisible();
    // Wait for 2 seconds to stabilize plot data - future timestamp
    // eslint-disable-next-line
    await page.waitForTimeout(2000);
    // Capture the # of plot points
    const plotPixels = await getCanvasPixels(page, 'canvas');
    const plotPixelSizeAtPause = plotPixels.length;
    // Wait 2 seconds
    // eslint-disable-next-line
    await page.waitForTimeout(2000);
    // Capture the # of plot points
    const plotPixelsAfterWait = await getCanvasPixels(page, 'canvas');
    const plotPixelSizeAfterWait = plotPixelsAfterWait.length;
    // Expect before and after plot points to match
    await expect(plotPixelSizeAtPause).toEqual(plotPixelSizeAfterWait);
  });
});
