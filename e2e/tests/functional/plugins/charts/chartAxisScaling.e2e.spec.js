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
 * This test suite covers manual (fixed) axis scaling for the two Plotly-based
 * chart types: the Bar Graph (registered under the name "Graph") and the
 * Scatter Plot. Both support an "Auto scale" toggle plus Minimum/Maximum
 * values per axis, configurable in edit mode only.
 */

import {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject,
  getDomainObject,
  navigateToObjectWithFixedTimeBounds
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

// Fixed bounds so the charts have deterministic data to render.
const START_BOUND = 1648591200000; // 2022-03-28 22:00:00.000 UTC
const END_BOUND = 1648591230000; // 2022-03-28 22:00:30.000 UTC

test.describe('Chart axis scaling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Bar Graph can be given a fixed Y axis range', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    // Auto scale is on by default
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await expect(page.getByRole('checkbox', { name: 'Y Axis Auto scale' })).toBeChecked();

    await setFixedRange(page, 'Y Axis', '-5', '5');
    await saveAndFinishEditing(page);

    await expect.poll(() => getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-5, 5]);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.yAxis.autoscale).toBe(false);
    expect(persisted.configuration.yAxis.range).toEqual({ min: -5, max: 5 });
  });

  test('Scatter Plot can be given fixed X and Y axis ranges', async ({ page }) => {
    const scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
    await createExampleTelemetryObject(page, scatterPlot.uuid);

    await navigateToObjectWithFixedTimeBounds(page, scatterPlot.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();

    await setFixedRange(page, 'X Axis', '0', '20');
    await setFixedRange(page, 'Y Axis', '-5', '5');
    await saveAndFinishEditing(page);

    await expect.poll(() => getPlotlyRange(page, '.c-scatter-chart', 'xaxis')).toEqual([0, 20]);
    await expect.poll(() => getPlotlyRange(page, '.c-scatter-chart', 'yaxis')).toEqual([-5, 5]);

    const persisted = await getDomainObject(page, scatterPlot.uuid);
    expect(persisted.configuration.xAxis.range).toEqual({ min: 0, max: 20 });
    expect(persisted.configuration.yAxis.range).toEqual({ min: -5, max: 5 });
  });

  test('Fixed scaling is read-only outside of edit mode', async ({ page }) => {
    const scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
    await createExampleTelemetryObject(page, scatterPlot.uuid);

    await navigateToObjectWithFixedTimeBounds(page, scatterPlot.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-5', '5');
    await saveAndFinishEditing(page);

    // Back in browse mode the values are shown as text, not as form controls
    await page.getByRole('tab', { name: 'Config' }).click();
    await expect(page.getByLabel('Y Axis Auto scale')).toHaveText('Disabled');
    await expect(page.getByLabel('Y Axis Minimum value')).toHaveText('-5');
    await expect(page.getByLabel('Y Axis Maximum value')).toHaveText('5');
    await expect(page.getByRole('checkbox', { name: 'Y Axis Auto scale' })).toBeHidden();
  });

  test('A fixed range applies to a chart with no data yet', async ({ page }) => {
    // The Y axis layout is derived from the traces, so an empty chart is the
    // case most likely to silently drop the configured range.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await page.goto(barGraph.url);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-5', '5');

    await expect.poll(() => getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-5, 5]);
  });

  test('An invalid range is reported and not persisted', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();

    // Minimum greater than Maximum
    await setFixedRange(page, 'Y Axis', '10', '1');

    await expect(page.getByText('Minimum must be less than Maximum.')).toBeVisible();

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.yAxis.range).toBeUndefined();
  });
});

/**
 * Turn off auto scale for the given axis and set its minimum and maximum.
 * @param {import('@playwright/test').Page} page
 * @param {'X Axis' | 'Y Axis'} axisLabel
 * @param {string} min
 * @param {string} max
 */
async function setFixedRange(page, axisLabel, min, max) {
  await page.getByRole('checkbox', { name: `${axisLabel} Auto scale` }).uncheck();
  await page.getByLabel(`${axisLabel} Minimum value`).fill(min);
  await page.getByLabel(`${axisLabel} Maximum value`).fill(max);
  // Blur so the final @change handler fires before we assert or save
  await page.getByLabel(`${axisLabel} Maximum value`).blur();
}

/**
 * Save the object and dismiss the resulting banner.
 * @param {import('@playwright/test').Page} page
 */
async function saveAndFinishEditing(page) {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await Promise.all([
    page.getByRole('listitem', { name: 'Save and Finish Editing' }).click(),
    // eslint-disable-next-line playwright/no-raw-locators
    page.locator('.c-message-banner__message').hover({ trial: true })
  ]);
  // Dismiss the save banner so it cannot intercept subsequent clicks
  // eslint-disable-next-line playwright/no-raw-locators
  await page.locator('.c-message-banner__close-button').click();
  // eslint-disable-next-line playwright/no-raw-locators
  await page.locator('.c-message-banner__message').waitFor({ state: 'detached' });
}

/**
 * Read the range Plotly actually resolved for an axis. This is the most direct
 * assertion available for these views - they are Plotly, not the WebGL plot
 * stack, so `waitForPlotsToRender`/`getCanvasPixels` do not apply.
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<Array<number>>}
 */
function getPlotlyRange(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el._fullLayout?.[axisName]?.range;
  }, axis);
}
