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

/**
 * Axis scaling configuration shared by the Bar Graph and Scatter Plot views.
 *
 * Both types persist axis scaling under `configuration.axisScaling`:
 *
 *     axisScaling: {
 *       xAxis: { autoscale: <boolean>, range: { min: <number>, max: <number> } },
 *       yAxis: { ...same..., logMode: <boolean> }
 *     }
 *
 * `range` is only meaningful when `autoscale` is `false`. `logMode` applies to
 * the Y axis only - see `isLogModeEnabled`. The inner objects deliberately
 * mirror the shape time-domain plots use for their own `configuration.yAxis`
 * (see src/plugins/plot/configuration/YAxisModel.js).
 *
 * Note that log mode here does NOT behave the way it does on a time-domain
 * plot. Plots transform values with `symlog`, which is defined for zero and
 * negatives, so no data is ever hidden. Plotly has no symlog (verified against
 * plotly.js-basic-dist-min@2.29.1) so these charts use its native log10 axis,
 * which silently discards every value <= 0. The inspector says so when log
 * mode is switched on, since that is a property of the axis rather than of
 * whatever data happens to be on screen.
 *
 * These charts have two neighbouring configuration keys that sound similar but
 * are unrelated concerns. Do not confuse them:
 *
 *   configuration.axes         { xKey, yKey } - WHICH telemetry field is
 *                              plotted on each axis.
 *   configuration.axisScaling  HOW each axis is scaled. This file.
 *   configuration.ranges       { domainMin, domainMax, rangeMin, rangeMax } -
 *                              Scatter Plot only. Bounds for the optional
 *                              underlay drawing, set from the create form.
 *                              Applies only when an underlay file is loaded,
 *                              and defers to a fixed range from axisScaling.
 */

/**
 * The persisted configuration key holding all axis scaling.
 */
export const AXIS_SCALING_KEY = 'axisScaling';

/**
 * The default configuration for a single axis. Objects created before axis
 * scaling was introduced have no `axisScaling` key at all, and must read as
 * auto scaled.
 *
 * Frozen because `getAxisConfig` hands this exact object back to callers when
 * the domain object has no stored configuration - mutating it in place would
 * poison the default for every other chart in the application.
 */
export const DEFAULT_AXIS_CONFIG = Object.freeze({ autoscale: true, logMode: false });

/**
 * The default `configuration.axisScaling` for a newly created chart.
 *
 * @returns {{xAxis: Object, yAxis: Object}}
 */
export function getDefaultAxisScaling() {
  return {
    xAxis: { ...DEFAULT_AXIS_CONFIG },
    yAxis: { ...DEFAULT_AXIS_CONFIG }
  };
}

/**
 * Read the scaling configuration for a single axis, falling back to the
 * default for objects persisted before this feature existed.
 *
 * @param {import('openmct').DomainObject} domainObject a Bar Graph or Scatter Plot
 * @param {'xAxis' | 'yAxis'} axisKey which axis to read
 * @returns {{autoscale: boolean, range?: {min: number, max: number}}}
 */
export function getAxisConfig(domainObject, axisKey) {
  return domainObject?.configuration?.[AXIS_SCALING_KEY]?.[axisKey] ?? DEFAULT_AXIS_CONFIG;
}

/**
 * Whether an axis should be drawn on a logarithmic scale.
 *
 * Log scaling is offered on the Y axis only. Bar Graph X values are metadata
 * names rather than numbers, so a log scale there is meaningless, and Scatter
 * Plot X is left linear for consistency between the two chart types. This is
 * the single place that rule is enforced, so the views and the inspector form
 * cannot disagree about it.
 *
 * @param {import('openmct').DomainObject} domainObject a Bar Graph or Scatter Plot
 * @param {'xAxis' | 'yAxis'} axisKey which axis to read
 * @returns {boolean}
 */
export function isLogModeEnabled(domainObject, axisKey) {
  if (axisKey !== 'yAxis') {
    return false;
  }

  return getAxisConfig(domainObject, axisKey).logMode === true;
}

/**
 * Whether a value is usable as a bound on a log10 axis. Zero is excluded
 * because log10(0) is -Infinity, so an axis bounded there has no lower end.
 *
 * This is about axis *bounds*, not about which samples get drawn - Plotly
 * discards any data value <= 0 on a log axis regardless of the bounds.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlottableOnLogAxis(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Tick configuration for a logarithmic axis.
 *
 * Left to itself Plotly labels every minor tick on a log axis: a three-decade
 * range renders 28 labels - 0.1, 2, 3 ... 9, 1, 2 ... 9, 10, 2 ... 9, 100 -
 * which is unreadable.
 *
 * `nticks` caps the label density and adapts as the range widens, dropping to
 * every second or third decade rather than crowding. 4 is the highest value
 * that still yields one label per decade from three decades up; 5 falls back to
 * a 1-2-5 pattern and puts 10 labels on a three-decade axis again. Within a
 * single decade Plotly labels the digits regardless, which is legible because
 * there is only one decade on screen.
 *
 * The `minor` block keeps the fine gridlines that capping the labels would
 * otherwise remove, unlabelled, so they read as reference lines rather than
 * clutter. Returned fresh each call because Plotly normalises the layout object
 * it is given.
 *
 * @returns {Object} the tick portion of a Plotly log axis layout
 */
export function getLogAxisTickLayout() {
  return {
    tickmode: 'auto',
    nticks: 4,
    minor: { dtick: 'D1', ticks: '', showgrid: true }
  };
}

/**
 * Whether an axis bound is set.
 *
 * A blank field is persisted as `null` and means "autorange this end". Zero is
 * a real bound - anchoring a linear chart at zero is an ordinary request - so
 * only the absence of a number counts as unset.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBoundSet(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Build the Plotly layout describing an axis's bounds.
 *
 * A range may fix neither end, one end, or both, which do not share a shape:
 *
 *   neither -> plain autorange
 *   one     -> autorange, held on that side by `autorangeoptions`
 *   both    -> an explicit `range`
 *
 * Every one of these bounds is given to Plotly in LOG units when the axis type
 * is `log`, `autorangeoptions` included. Verified against
 * plotly.js-basic-dist-min@2.29.1: `{maxallowed: 100}` on a log axis produced a
 * range topping out at 10^100, while `{maxallowed: 2}` correctly capped it at
 * 100. `range` behaves identically - [1, 1000] draws an axis from 10^1 to
 * 10^1000 - so neither may be passed in data units.
 *
 * @param {{min: ?number, max: ?number}} range the configured range, in data units
 * @param {boolean} logMode whether the axis is logarithmic
 * @returns {Object} the bounds portion of a Plotly axis layout
 */
export function getAxisBoundsLayout(range, logMode) {
  const hasMin = isUsableBound(range?.min, logMode);
  const hasMax = isUsableBound(range?.max, logMode);

  // A log axis cannot draw a value of zero, but an operator comparing spectra
  // still wants the axis anchored and labelled at 0 - it keeps the viewport
  // locked and reads naturally. Honour that: floor the drawable area just below
  // the first decade and label the floor "0". Values of zero remain unplottable,
  // which the chart already reports separately.
  if (logMode && range?.min === 0 && isBoundSet(range?.max) && range.max > 0) {
    return getZeroAnchoredLogLayout(range.max);
  }

  if (hasMin && hasMax) {
    return {
      autorange: false,
      range: [toAxisUnits(range.min, logMode), toAxisUnits(range.max, logMode)]
    };
  }

  if (hasMin) {
    return {
      autorange: true,
      autorangeoptions: { minallowed: toAxisUnits(range.min, logMode) }
    };
  }

  if (hasMax) {
    return {
      autorange: true,
      autorangeoptions: { maxallowed: toAxisUnits(range.max, logMode) }
    };
  }

  return { autorange: true };
}

/**
 * How far below the first decade the "0" anchor sits, in decades. Small enough
 * that it does not waste plot height, large enough that the label clears the
 * one above it.
 */
const ZERO_ANCHOR_DECADES = 0.4;

/**
 * A log axis running from a labelled "0" up to `max`.
 *
 * The axis floor is a fraction of a decade below 1, tick-labelled "0". Above it
 * the ticks are chosen to suit how many decades are on screen: a narrow axis
 * gets 1-2-5 steps within each decade, a wide one only decades, and a very wide
 * one every second or third decade. Labelling decades alone leaves a short axis
 * almost empty - a 0 to 10 axis would carry three labels for its whole height.
 *
 * Ticks have to be given explicitly here, and the units differ from `range`:
 * Plotly takes `tickvals` in DATA units on a log axis while `range` is in log
 * units. Verified against plotly.js-basic-dist-min@2.29.1 - tickvals passed in
 * log units are silently dropped.
 *
 * @param {number} max the configured maximum, in data units
 * @returns {Object} a Plotly axis layout
 */
function getZeroAnchoredLogLayout(max) {
  const floor = Math.pow(10, -ZERO_ANCHOR_DECADES);
  const decades = Math.log10(max) + ZERO_ANCHOR_DECADES;
  const mantissas = decades <= 3 ? [1, 2, 5] : [1];
  const stride = decades <= 6 ? 1 : Math.ceil(decades / 6);

  const tickvals = [floor];
  const ticktext = ['0'];

  // Anchor the stride to a multiple of itself so 1 is always a labelled tick.
  // Starting from the floor's own exponent would offset the whole sequence and
  // produce runs like 10, 1000, 100k that skip it.
  const rawFirst = Math.floor(Math.log10(floor));
  const firstExponent = Math.floor(rawFirst / stride) * stride;

  for (let exponent = firstExponent; exponent <= Math.floor(Math.log10(max)); exponent += stride) {
    for (const mantissa of mantissas) {
      const value = Number((mantissa * Math.pow(10, exponent)).toPrecision(12));
      if (value < floor || value > max) {
        continue;
      }

      tickvals.push(value);
      ticktext.push(formatTick(value));
    }
  }

  // Always label the configured maximum. A fixed axis whose top edge carries no
  // label reads as unfinished, and a strided sequence will not land on it - a
  // 0 to 1e9 axis steps 1, 100, 10k, 1M, 100M and stops short.
  if (tickvals[tickvals.length - 1] !== max) {
    tickvals.push(max);
    ticktext.push(formatTick(max));
  }

  return {
    autorange: false,
    range: [-ZERO_ANCHOR_DECADES, Math.log10(max)],
    tickmode: 'array',
    tickvals,
    ticktext
  };
}

/**
 * Label a tick the way Plotly would have, so overriding the ticks does not
 * change how numbers read. Plotly prints plainly up to 1000 and switches to SI
 * suffixes above that - 10k, 1M - so match it.
 */
function formatTick(value) {
  const suffixes = [
    [1e12, 'T'],
    [1e9, 'G'],
    [1e6, 'M'],
    [1e3, 'k']
  ];

  if (value >= 1e4) {
    for (const [factor, suffix] of suffixes) {
      if (value >= factor) {
        return `${value / factor}${suffix}`;
      }
    }
  }

  return String(value);
}

/**
 * Express a bound in the units the axis is drawn in.
 */
function toAxisUnits(value, logMode) {
  return logMode ? Math.log10(value) : value;
}

/**
 * Whether a bound can actually be drawn.
 *
 * A bound of zero or less has no logarithmic representation. The inspector
 * rejects those, but a hand-edited or imported configuration could still carry
 * one - autorange that end rather than hand Plotly an infinite bound.
 */
function isUsableBound(value, logMode) {
  return isBoundSet(value) && (!logMode || isPlottableOnLogAxis(value));
}
