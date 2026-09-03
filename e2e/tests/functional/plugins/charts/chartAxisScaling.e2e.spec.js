/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

import { v4 as uuid } from 'uuid';

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

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-5, 5]);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.autoscale).toBe(false);
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: -5, max: 5 });
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

    expect(await getPlotlyRange(page, '.c-scatter-chart', 'xaxis')).toEqual([0, 20]);
    expect(await getPlotlyRange(page, '.c-scatter-chart', 'yaxis')).toEqual([-5, 5]);

    const persisted = await getDomainObject(page, scatterPlot.uuid);
    expect(persisted.configuration.axisScaling.xAxis.range).toEqual({ min: 0, max: 20 });
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: -5, max: 5 });
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

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-5, 5]);
  });

  test('A fixed range applies to a Scatter Plot with no data yet', async ({ page }) => {
    // Same empty-layout branch as the Bar Graph, in the Scatter Plot's code
    const scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
    await page.goto(scatterPlot.url);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-5', '5');

    expect(await getPlotlyRange(page, '.c-scatter-chart', 'yaxis')).toEqual([-5, 5]);
  });

  test('Re-enabling auto scale returns the axis to automatic ranging', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-5', '5');
    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-5, 5]);

    await page.getByRole('checkbox', { name: 'Y Axis Auto scale' }).check();

    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(true);
    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).not.toEqual([-5, 5]);
  });

  test('Charts saved before axis scaling existed default to auto scale', async ({ page }) => {
    // Objects created by earlier versions have a configuration but no
    // axisScaling key. This fallback stands in for a data migration.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await page.evaluate(async (objectUuid) => {
      const openmct = window.openmct;
      const domainObject = await openmct.objects.get(objectUuid);
      const configuration = { ...domainObject.configuration };
      delete configuration.axisScaling;
      openmct.objects.mutate(domainObject, 'configuration', configuration);
    }, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(true);
    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'xaxis')).toBe(true);

    // The inspector reports auto scale for the missing configuration too
    await page.getByRole('tab', { name: 'Config' }).click();
    await expect(page.getByLabel('Y Axis Auto scale')).toHaveText('Enabled');
    await expect(page.getByLabel('X Axis Auto scale')).toHaveText('Enabled');
  });

  test('A fixed range takes precedence over Scatter Plot underlay ranges', async ({ page }) => {
    // Underlay ranges are an existing feature configured at create time. They
    // must keep working while auto scale is on, and defer to a fixed range.
    const scatterPlot = await createScatterPlotWithUnderlay(page, {
      domainMin: '0',
      domainMax: '100',
      rangeMin: '-50',
      rangeMax: '50'
    });
    await createExampleTelemetryObject(page, scatterPlot.uuid);

    await navigateToObjectWithFixedTimeBounds(page, scatterPlot.url, START_BOUND, END_BOUND);

    // Auto scale is on, so the underlay ranges drive the axes. This is the one
    // assertion here that has to wait: underlay ranges only reach the layout
    // once the telemetry request resolves and a trace exists. The assertions
    // that follow a config change do not, since that path is synchronous.
    await expect.poll(() => getPlotlyRange(page, '.c-scatter-chart', 'yaxis')).toEqual([-50, 50]);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-5', '5');

    expect(await getPlotlyRange(page, '.c-scatter-chart', 'yaxis')).toEqual([-5, 5]);
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
    expect(persisted.configuration.axisScaling.yAxis.range).toBeUndefined();
  });

  test('Equal bounds are rejected, not silently widened by Plotly', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '5', '5');

    await expect(page.getByText('Minimum must be less than Maximum.')).toBeVisible();

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toBeUndefined();
  });

  test('Bar Graph Y axis can be drawn on a log scale', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await expect(page.getByRole('checkbox', { name: 'Y Axis Log mode' })).not.toBeChecked();

    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    await saveAndFinishEditing(page);

    expect(await getPlotlyAxisType(page, '.c-bar-chart', 'yaxis')).toBe('log');

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.logMode).toBe(true);
  });

  test('Scatter Plot Y axis can be drawn on a log scale', async ({ page }) => {
    const scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
    await createExampleTelemetryObject(page, scatterPlot.uuid);

    await navigateToObjectWithFixedTimeBounds(page, scatterPlot.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    // Enabling log mode raises a notice that the user dismisses. Clear it
    // before saving, or two banners stack and saveAndFinishEditing waits on the
    // wrong one.
    await dismissNotifications(page);
    await saveAndFinishEditing(page);

    expect(await getPlotlyAxisType(page, '.c-scatter-chart', 'yaxis')).toBe('log');
    // The X axis is unaffected - log scaling is offered on Y only. Plotly
    // resolves every axis type, so a linear axis reads as 'linear', not absent.
    expect(await getPlotlyAxisType(page, '.c-scatter-chart', 'xaxis')).toBe('linear');
  });

  test('A fixed range is given to Plotly in log units', async ({ page }) => {
    // Plotly takes `range` as exponents when the axis type is log, so a range
    // of 1 to 1000 must reach it as [0, 3]. Passing the raw numbers would draw
    // an axis running from 10^1 to 10^1000.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    await setFixedRange(page, 'Y Axis', '1', '1000');
    await saveAndFinishEditing(page);

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([0, 3]);

    // The configuration still stores the values the user typed, in data units
    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: 1, max: 1000 });
  });

  test('Log mode is offered on the Y axis only', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();

    // Bar Graph X values are metadata names, so a log scale is meaningless there
    await expect(page.getByRole('checkbox', { name: 'Y Axis Log mode' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'X Axis Log mode' })).toBeHidden();
    // Fixed range controls remain on both axes
    await expect(page.getByRole('checkbox', { name: 'X Axis Auto scale' })).toBeVisible();
  });

  test('Enabling log mode says what a log axis cannot show', async ({ page }) => {
    // The limitation belongs to the axis, not to whatever data is on screen, so
    // it is stated once to whoever configures the chart rather than detected
    // while plotting. It stays until dismissed.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();

    // Creating the telemetry object leaves a "Save successful" banner holding
    // the notification slot. Open MCT shows one at a time and queues the rest,
    // so clear it or the notice never becomes the visible banner.
    await dismissNotifications(page);

    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();

    await expect(page.getByText(/logarithmic axis can only show positive values/)).toBeVisible();
  });

  test('A log axis can be anchored and labelled at zero', async ({ page }) => {
    // A log axis cannot draw a value of zero, but the axis is still anchored
    // and labelled at 0 so the viewport stays locked and reads naturally when
    // comparing spectra.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    await setFixedRange(page, 'Y Axis', '0', '1000');

    // The bottom of the axis reads 0, with decades above it
    expect(await getPlotlyTickText(page, '.c-bar-chart', 'yaxis')).toEqual([
      '0',
      '1',
      '10',
      '100',
      '1000'
    ]);
    // Fixed, not autoranged - this is the whole point of the locked viewport
    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(false);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: 0, max: 1000 });
  });

  test('A log axis rejects a negative minimum', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    await setFixedRange(page, 'Y Axis', '-5', '1000');

    await expect(page.getByText('Minimum cannot be negative in log mode.')).toBeVisible();

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toBeUndefined();
  });
  test('Fixed scaling requires both bounds', async ({ page }) => {
    // One bound alone leaves Plotly to choose the other, which reads as auto
    // scaling while the inspector claims the axis is fixed.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '', '500');

    await expect(page.getByText('Specify both a Minimum and a Maximum.')).toBeVisible();

    // Nothing usable was entered, so the axis keeps auto ranging - the form and
    // the chart agree that no fixed range is in effect.
    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(true);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toBeUndefined();
  });

  test('Zero is a literal minimum on a linear axis, not an instruction to autoscale', async ({
    page
  }) => {
    // Anchoring a linear chart at zero is an ordinary request, and must not be
    // mistaken for an empty field.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '0', '500');

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([0, 500]);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: 0, max: 500 });
  });

  test('A fixed range survives a save and reload', async ({ page }) => {
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '25', '750');
    await saveAndFinishEditing(page);

    await page.reload({ waitUntil: 'domcontentloaded' });

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([25, 750]);

    // A reload lands in browse mode with no inspector tab selected
    await page.getByRole('tab', { name: 'Config' }).click();
    await expect(page.getByLabel('Y Axis Minimum value')).toHaveText('25');
    await expect(page.getByLabel('Y Axis Maximum value')).toHaveText('750');
  });

  test('The zero anchor sits below the data at every order of magnitude', async ({ page }) => {
    // The anchor floor is derived from the configured maximum. A fixed floor
    // would sit above any maximum below it, and Plotly reads a descending range
    // as an instruction to draw the axis upside-down.
    const cases = [
      { max: '0.05', ticks: ['0', '0.001', '0.002', '0.005', '0.01', '0.02', '0.05'] },
      { max: '0.5', ticks: ['0', '0.01', '0.02', '0.05', '0.1', '0.2', '0.5'] },
      { max: '10', ticks: ['0', '1', '2', '5', '10'] },
      { max: '1000000', ticks: ['0', '1', '100', '10k', '1M'] },
      { max: '1000000000', ticks: ['0', '1', '100', '10k', '1M', '100M', '1G'] }
    ];

    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();

    for (const { max, ticks } of cases) {
      await setFixedRange(page, 'Y Axis', '0', max);

      const range = await getPlotlyRange(page, '.c-bar-chart', 'yaxis');
      expect(range[0], `axis is not inverted at max ${max}`).toBeLessThan(range[1]);
      expect(await getPlotlyTickText(page, '.c-bar-chart', 'yaxis')).toEqual(ticks);
    }
  });

  test('Enabling log mode clamps a negative minimum to zero', async ({ page }) => {
    // A negative minimum is a legitimate linear bound with no logarithmic
    // reading, but zero is one this axis draws - anchored and labelled. Clamp
    // to it, so the range stays complete instead of losing a bound.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-50', '100');

    expect(await getPlotlyRange(page, '.c-bar-chart', 'yaxis')).toEqual([-50, 100]);

    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();

    await expect(page.getByLabel('Y Axis Minimum value')).toHaveValue('0');

    // Still a fixed range, now zero-anchored - not an autorange, and not a
    // half-specified range.
    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(false);
    expect(await getPlotlyTickText(page, '.c-bar-chart', 'yaxis')).toEqual([
      '0',
      '1',
      '2',
      '5',
      '10',
      '20',
      '50',
      '100'
    ]);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.range).toEqual({ min: 0, max: 100 });
    expect(persisted.configuration.axisScaling.yAxis.logMode).toBe(true);
  });

  test('Enabling log mode re-enables auto scale for a range entirely below zero', async ({
    page
  }) => {
    // Clamping the minimum cannot rescue this one - a maximum of zero or less
    // has no logarithmic reading either, so there is nothing to clamp to and
    // fixed scaling cannot be honoured at all.
    const barGraph = await createDomainObjectWithDefaults(page, { type: 'Graph' });
    await createExampleTelemetryObject(page, barGraph.uuid);

    await navigateToObjectWithFixedTimeBounds(page, barGraph.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await setFixedRange(page, 'Y Axis', '-100', '-10');

    // Clear the banners queued by object creation, so the notice raised below
    // is the one on screen rather than a predecessor.
    await dismissNotifications(page);

    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();

    // Auto scale is turned back on, and says so rather than flipping silently
    await expect(page.getByRole('checkbox', { name: 'Y Axis Auto scale' })).toBeChecked();
    await expect(page.getByText(/auto scale has been turned back on/)).toBeVisible();

    expect(await getPlotlyAutorange(page, '.c-bar-chart', 'yaxis')).toBe(true);

    const persisted = await getDomainObject(page, barGraph.uuid);
    expect(persisted.configuration.axisScaling.yAxis.autoscale).toBe(true);
    expect(persisted.configuration.axisScaling.yAxis.logMode).toBe(true);
  });

  test('A zoomed log Scatter Plot keeps its Y tick labels', async ({ page }) => {
    // A zero-anchored axis lists its ticks explicitly, chosen for the whole
    // configured range. Zooming between two of them would otherwise leave the
    // axis with no labels at all.
    const scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
    await createExampleTelemetryObject(page, scatterPlot.uuid);

    await navigateToObjectWithFixedTimeBounds(page, scatterPlot.url, START_BOUND, END_BOUND);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByRole('checkbox', { name: 'Y Axis Log mode' }).check();
    await setFixedRange(page, 'Y Axis', '0', '1000000');
    await dismissNotifications(page);
    await saveAndFinishEditing(page);

    await expect.poll(() => getPlotlyTickMode(page, '.c-scatter-chart', 'yaxis')).toBe('array');

    // Zoom into a window between the 100 and 10k ticks, where the explicit tick
    // array has nothing to show.
    await zoomPlotlyYAxis(page, '.c-scatter-chart', [Math.log10(200), Math.log10(5000)]);

    // Polled rather than read directly: unlike a config change, this one is not
    // synchronous end to end. The view hands tick generation back with
    // `Plotly.relayout`, whose promise nothing here can await.
    await expect.poll(() => getPlotlyTickMode(page, '.c-scatter-chart', 'yaxis')).toBe('auto');
    // The control carries a `title` and no accessible label. Match it exactly:
    // the unsynced indicator's own title contains this string too.
    await expect(page.getByTitle('Reset pan/zoom', { exact: true })).toBeEnabled();
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
 * Clear every notification banner that is showing. Needed before saving in
 * tests that raise one: saveAndFinishEditing waits for the banner it expects to
 * detach, and a second banner left behind keeps that wait alive.
 * @param {import('@playwright/test').Page} page
 */
async function dismissNotifications(page) {
  // eslint-disable-next-line playwright/no-raw-locators
  const closeButtons = page.locator('.c-message-banner__close-button');

  // Open MCT queues notifications, so dismissing the visible banner reveals the
  // next one rather than reducing the count - see _selectNextNotification in
  // NotificationAPI. Re-count after every click instead of assuming a total.
  for (let attempt = 0; attempt < 10; attempt++) {
    if ((await closeButtons.count()) === 0) {
      return;
    }

    await closeButtons.first().click();
  }

  await expect(closeButtons).toHaveCount(0);
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
  // Clear the save banner so it cannot intercept subsequent clicks. Use the
  // queue-aware helper: Open MCT shows one notification at a time, so if
  // another was already pending, closing this one just reveals the next and
  // waiting for the banner to detach would hang.
  await dismissNotifications(page);
}

/**
 * Read the range Plotly resolved for an axis, from `gd.layout` - Plotly's
 * documented public view of current graph state. When auto ranging, Plotly
 * writes the computed range back into it, so this reports the effective range
 * either way. Deliberately not `gd._fullLayout`, which is private.
 *
 * This is the most direct assertion available for these views: they are Plotly,
 * not the WebGL plot stack, so `waitForPlotsToRender`/`getCanvasPixels` do not
 * apply. Do not assert on rendered tick labels instead - Plotly picks its own
 * "nice" tick values inside a range, so a range of [-5, 5] renders ticks
 * -4, -2, 0, 2, 4 and never shows the bounds themselves.
 *
 * Callers can generally assert on this directly rather than polling. Applying a
 * config change is synchronous end to end: the mutation emits synchronously,
 * the observer redraws synchronously, and Plotly merges the new layout into
 * `gd.layout` during that call - none of it waits on a render. Polling is only
 * needed when the value depends on telemetry arriving.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<Array<number>>}
 */
function getPlotlyRange(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el.layout?.[axisName]?.range;
  }, axis);
}

/**
 * Read the axis `type` Plotly resolved, from the public `gd.layout`. Undefined
 * for a linear axis, since the views only set `type` when log mode is on.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<string | undefined>}
 */
function getPlotlyAxisType(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el.layout?.[axisName]?.type;
  }, axis);
}

/**
 * Read the tick labels Plotly rendered for an axis, from the public `gd.layout`.
 * Only meaningful where the ticks are given explicitly - a zero-anchored log
 * axis overrides them so the floor can read "0".
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<Array<string> | undefined>}
 */
function getPlotlyTickText(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el.layout?.[axisName]?.ticktext;
  }, axis);
}

/**
 * Read how Plotly is choosing tick positions for an axis, from the public
 * `gd.layout`. A zero-anchored log axis lists them explicitly ('array'); every
 * other case leaves them to Plotly ('auto').
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<string | undefined>}
 */
function getPlotlyTickMode(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el.layout?.[axisName]?.tickmode;
  }, axis);
}

/**
 * Zoom the Y axis to an explicit range, the way a drag-select does.
 *
 * A synthetic drag cannot be aimed at a data range with any precision, and what
 * is under test is the view's `plotly_relayout` handler rather than Plotly's own
 * hit testing. A Plotly graph element is an event emitter, so raise exactly the
 * event a drag raises. Plotly itself is bundled as a module and has no window
 * global, so it cannot be called from here - the view's handler does the
 * relayout.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {Array<number>} range in LOG units on a log axis
 */
async function zoomPlotlyYAxis(page, chartSelector, range) {
  // eslint-disable-next-line playwright/no-raw-locators
  await page.locator(chartSelector).evaluate((el, yRange) => {
    el.emit('plotly_relayout', {
      'yaxis.range[0]': yRange[0],
      'yaxis.range[1]': yRange[1]
    });
  }, range);
}

/**
 * Read whether Plotly is auto ranging an axis, from the public `gd.layout`.
 * @param {import('@playwright/test').Page} page
 * @param {string} chartSelector '.c-bar-chart' or '.c-scatter-chart'
 * @param {'xaxis' | 'yaxis'} axis
 * @returns {Promise<boolean>}
 */
function getPlotlyAutorange(page, chartSelector, axis) {
  // eslint-disable-next-line playwright/no-raw-locators
  return page.locator(chartSelector).evaluate((el, axisName) => {
    return el.layout?.[axisName]?.autorange;
  }, axis);
}

/**
 * Create a Scatter Plot with an underlay file and underlay ranges. These are
 * only settable from the create form, so this cannot use
 * createDomainObjectWithDefaults.
 * @param {import('@playwright/test').Page} page
 * @param {{domainMin: string, domainMax: string, rangeMin: string, rangeMax: string}} ranges
 * @returns {Promise<{name: string, uuid: string, url: string}>}
 */
async function createScatterPlotWithUnderlay(page, ranges) {
  const name = `Scatter Plot:${uuid()}`;

  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('menuitem', { name: 'Scatter Plot' }).click();
  await page.getByLabel('Title', { exact: true }).fill(name);

  // A shape with x/y arrays is the minimum an underlay file needs to render
  await page.getByLabel('Select File...').setInputFiles({
    name: 'underlay.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{ x: [0, 100], y: [-50, 50] }]))
  });

  for (const [field, value] of Object.entries(ranges)) {
    // eslint-disable-next-line playwright/no-raw-locators
    await page.locator(`[data-field-name="${field}"]`).fill(value);
  }

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL('**/mine/*');

  const objectUuid = page.url().split('?')[0].split('/').pop();

  // Leave edit mode, otherwise the Create button stays disabled
  const isEditing = await page.evaluate(() => {
    const openmct = window.openmct;
    return openmct.editor.isEditing();
  });
  if (isEditing) {
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
  }

  return { name, uuid: objectUuid, url: `./#/browse/mine/${objectUuid}` };
}
