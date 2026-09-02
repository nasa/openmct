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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

import { createDomainObjectWithDefaults, setTimeConductorBounds } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Log plot tests', () => {
  test.beforeEach(async ({ page }) => {
    // fresh page with time range from 2022-03-29 22:00:00.000Z to 2022-03-29 22:00:30.000Z
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Set a specific time range for consistency, otherwise it will change
    // on every test to a range based on the current time.
    const startDate = '2022-03-29';
    const startTime = '22:00:00';
    const endDate = '2022-03-29';
    const endTime = '22:00:30';

    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Unnamed Overlay Plot'
    });

    // create a sinewave generator
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Unnamed Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();

    // set amplitude to 6, offset 4, data rate 2 hz
    await page.getByLabel('Amplitude', { exact: true }).fill('6');
    await page.getByLabel('Offset', { exact: true }).fill('4');
    await page.getByLabel('Data Rate (hz)', { exact: true }).fill('2');

    await page.getByLabel('Save').click();

    await page.goto(overlayPlot.url);
  });
  test('Log Plot ticks are functionally correct in regular and log mode and after refresh', async ({
    page
  }) => {
    await testRegularTicks(page);
    await enableEditMode(page);
    await page.getByRole('tab', { name: 'Config' }).click();
    await enableLogMode(page);
    await testLogTicks(page);
    await disableLogMode(page);
    await testRegularTicks(page);
    await enableLogMode(page);
    await testLogTicks(page);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await testLogTicks(page);
  });

  test('Enabling log mode on a large-amplitude series keeps the trace rendered', async ({
    page
  }) => {
    // The chart caches a per-axis offset and stores vertices relative to it in a
    // Float32Array. Log mode changes the space those values live in, so the offset
    // has to be rebuilt - otherwise a large stale offset consumes the float32
    // mantissa and the whole trace collapses onto a single row at the canvas edge.
    // A large vertical offset keeps the first sample large, which is what sets the
    // magnitude of the cached offset. Deliberately does not save or reload.
    const largePlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Large Amplitude Overlay Plot'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Large Amplitude Sine Wave Generator',
      parent: largePlot.uuid
    });

    // Creating the child leaves us on the generator, so its properties are editable here.
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();
    await page.getByLabel('Amplitude', { exact: true }).fill('1000000000000');
    await page.getByLabel('Offset', { exact: true }).fill('1000000000000');
    await page.getByLabel('Save').click();

    await page.goto(largePlot.url);

    await expect
      .poll(async () => (await measurePlotCanvases(page)).trace.rowSpan)
      .toBeGreaterThan(100);

    await enableEditMode(page);
    await page.getByRole('tab', { name: 'Config' }).click();
    await enableLogMode(page);

    // Without the offset rebuild the trace collapses to a rowSpan of 0.
    await expect
      .poll(async () => (await measurePlotCanvases(page)).trace.rowSpan)
      .toBeGreaterThan(100);
    // Alarm markers are drawn from the same offset, on a separate 2d canvas.
    // Measured by extent rather than pixel count, since markers collapsed onto a
    // single row by a stale offset still paint.
    await expect
      .poll(async () => (await measurePlotCanvases(page)).alarmMarkers.rowSpan)
      .toBeGreaterThan(100);
  });

  // Leaving test as 'TODO' for now.
  // NOTE: Not eligible for community contributions.
  test.fixme('Verify that log mode option is reflected in import/export JSON', async ({ page }) => {
    await enableEditMode(page);
    await enableLogMode(page);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // TODO ...export, delete the overlay, then import it...

    //await testLogTicks(page);

    // TODO, the plot is slightly at different position that in the other test, so this fails.
    // ...We can fix it by copying all steps from the first test...
    // await testLogPlotPixels(page);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function testRegularTicks(page) {
  const yTicks = page.locator('.gl-plot-y-tick-label');
  await expect(yTicks).toHaveCount(7);
  await expect(yTicks.nth(0)).toHaveText('-2');
  await expect(yTicks.nth(1)).toHaveText('0');
  await expect(yTicks.nth(2)).toHaveText('2');
  await expect(yTicks.nth(3)).toHaveText('4');
  await expect(yTicks.nth(4)).toHaveText('6');
  await expect(yTicks.nth(5)).toHaveText('8');
  await expect(yTicks.nth(6)).toHaveText('10');
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function testLogTicks(page) {
  // Log mode ticks are chosen as round numbers in data space, so they read as
  // powers of ten (or 1-3 / 1-2-5 steps for narrower ranges) rather than as the
  // result of transforming an evenly spaced tick back out of symlog space.
  const yTicks = page.locator('.gl-plot-y-tick-label');
  await expect(yTicks).toHaveCount(6);
  await expect(yTicks.nth(0)).toHaveText('-3');
  await expect(yTicks.nth(1)).toHaveText('-1');
  await expect(yTicks.nth(2)).toHaveText('0');
  await expect(yTicks.nth(3)).toHaveText('1');
  await expect(yTicks.nth(4)).toHaveText('3');
  await expect(yTicks.nth(5)).toHaveText('10');

  // Unlabelled gridlines fill in the decades between the labelled ticks.
  const minorGridlines = page.locator('.gl-plot-hash--minor');
  expect(await minorGridlines.count()).toBeGreaterThan(await yTicks.count());

  await testLogGridlineSpacing(page);
}

/**
 * Assert that no two horizontal gridlines are drawn close enough together to read
 * as a single thick line. Gridline selection has to clear the labelled tick ahead
 * of a candidate as well as whatever was drawn behind it, and checking only
 * backwards lets the last gridline in a decade land on the major that closes it -
 * 9 and 10 on a 1..1e6 range sit 0.7% of the span apart against a 1.2% threshold.
 *
 * This holds for any range, so it does not depend on the autoscale padding that
 * fixes the labelled ticks above.
 *
 * @param {import('@playwright/test').Page} page
 */
async function testLogGridlineSpacing(page) {
  // LOG_MINOR_SPACING in tickUtils.js, as a percentage of the axis, less a
  // tolerance for the rounding that goes through the style attribute.
  const minimumSeparation = 1.15;

  const positions = await page.locator('.gl-plot-hash.hash-h').evaluateAll((gridlines) =>
    gridlines
      .map((gridline) => Number.parseFloat(gridline.style.bottom))
      .filter((position) => Number.isFinite(position))
      .sort((a, b) => a - b)
  );

  expect(positions.length).toBeGreaterThan(1);

  const tooClose = positions
    .map((position, i) => (i === 0 ? null : { gap: position - positions[i - 1], position }))
    .filter((pair) => pair && pair.gap < minimumSeparation);

  expect(tooClose).toEqual([]);
}

/**
 * Measure what each of the plot's two canvases actually painted. The series line
 * and markers are drawn with WebGL on the main canvas; alarm markers are drawn
 * separately in 2d on the overlay canvas. `rowSpan` is the vertical extent of the
 * painted pixels, which is what distinguishes a real trace from one that has
 * collapsed to a single row.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{trace: {painted: number, rowSpan: number}, alarmMarkers: {painted: number, rowSpan: number}}>}
 */
async function measurePlotCanvases(page) {
  await expect(page.locator('.gl-plot-y-tick-label').first()).toBeVisible();

  return page.evaluate(() => {
    function measure(selector) {
      const source = document.querySelector(selector);
      const copy = document.createElement('canvas');
      copy.width = source.width;
      copy.height = source.height;
      const context = copy.getContext('2d');
      context.drawImage(source, 0, 0);

      const { data } = context.getImageData(0, 0, copy.width, copy.height);
      let painted = 0;
      let minRow = Infinity;
      let maxRow = -Infinity;
      for (let alpha = 3, pixel = 0; alpha < data.length; alpha += 4, pixel++) {
        if (data[alpha] !== 0) {
          painted++;
          const row = Math.floor(pixel / copy.width);
          minRow = Math.min(minRow, row);
          maxRow = Math.max(maxRow, row);
        }
      }

      return { painted, rowSpan: painted ? maxRow - minRow : 0 };
    }

    return {
      trace: measure('.gl-plot-chart-area .js-main-canvas'),
      alarmMarkers: measure('.gl-plot-chart-area .js-overlay-canvas')
    };
  });
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function enableEditMode(page) {
  // turn on edit mode
  await page.getByRole('button', { name: 'Edit Object' }).click();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function enableLogMode(page) {
  await expect(page.getByRole('checkbox', { name: 'Log mode' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Log mode' }).check();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function disableLogMode(page) {
  await expect(page.getByRole('checkbox', { name: 'Log mode' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Log mode' }).uncheck();
}

/**
 * @param {import('@playwright/test').Page} page
 */
// FIXME: Remove this eslint exception once implemented
// eslint-disable-next-line no-unused-vars
async function testLogPlotPixels(page) {
  const pixelsMatch = await page.evaluate(async () => {
    // TODO get canvas pixels at a few locations to make sure they're the correct color, to test that the plot comes out as expected.

    await new Promise((r) => setTimeout(r, 5 * 1000));

    // These are some pixels that should be blue points in the log plot.
    // If the plot changes shape to an unexpected shape, this will
    // likely fail, which is what we want.
    //
    // I found these pixels by pausing playwright in debug mode at this
    // point, and using similar code as below to output the pixel data, then
    // I logged those pixels here.
    const expectedBluePixels = [
      // TODO these pixel sets only work with the first test, but not the second test.

      // [60, 35],
      // [121, 125],
      // [156, 377],
      // [264, 73],
      // [372, 186],
      // [576, 73],
      // [659, 439],
      // [675, 423]

      [60, 35],
      [120, 125],
      [156, 375],
      [264, 73],
      [372, 185],
      [575, 72],
      [659, 437],
      [675, 421]
    ];

    // The first canvas in the DOM is the one that has the plot point
    // icons (canvas 2d), which is the one we are testing. The second
    // one in the DOM is the WebGL canvas with the line. (Why aren't
    // they both WebGL?)
    const canvas = document.querySelector('canvas');

    const ctx = canvas.getContext('2d');

    for (const pixel of expectedBluePixels) {
      // XXX Possible optimization: call getImageData only once with
      // area including all pixels to be tested.
      const data = ctx.getImageData(pixel[0], pixel[1], 1, 1).data;

      // #43b0ffff <-- openmct cyanish-blue with 100% opacity
      // if (data[0] !== 0x43 || data[1] !== 0xb0 || data[2] !== 0xff || data[3] !== 0xff) {
      if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
        // If any pixel is empty, it means we didn't hit a plot point.
        return false;
      }
    }

    return true;
  });

  expect(pixelsMatch).toBe(true);
}
