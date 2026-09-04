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
 *     axisScaling: {
 *       xAxis: { autoscale: <boolean>, range: { min: <number>, max: <number> } },
 *       yAxis: { ...same..., logMode: <boolean> }
 *     }
 *
 * `range` is only meaningful when `autoscale` is `false`, and requires both
 * bounds. `logMode` applies to the Y axis only - see `isLogModeEnabled`.
 *
 * Log mode here does NOT behave the way it does on a time-domain plot. Plots
 * transform values with `symlog`, which is defined for zero and negatives, so
 * no data is ever hidden. Plotly has no symlog (verified against
 * plotly.js-basic-dist-min@2.29.1) so these charts use its native log10 axis,
 * which silently discards every value <= 0. The inspector says so when log mode
 * is switched on.
 *
 * Two neighbouring configuration keys sound similar but are unrelated:
 *
 *   configuration.axes         { xKey, yKey } - WHICH telemetry field is
 *                              plotted on each axis.
 *   configuration.axisScaling  HOW each axis is scaled. This file.
 *   configuration.ranges       Scatter Plot only. Bounds for the optional
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
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlottableOnLogAxis(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Whether an axis bound is set. Zero is a real bound, so only the absence of a
 * number counts as unset.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBoundSet(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Build the complete axis layout for one axis of a chart.
 *
 * A manually configured fixed range wins. Failing that, a Scatter Plot may fall
 * back to its underlay bounds (`configuration.ranges`, set from the create
 * form) so existing plots keep their current behavior. Otherwise the axis
 * autoranges.
 *
 * @param {import('openmct').DomainObject} domainObject a Bar Graph or Scatter Plot
 * @param {'xAxis' | 'yAxis'} axisKey which axis to build
 * @param {{min: string|number, max: string|number}} [underlayRange] Scatter Plot underlay bounds
 * @returns {Object} a Plotly axis layout
 */
export function getAxisRangeLayout(domainObject, axisKey, underlayRange) {
  const axis = getAxisConfig(domainObject, axisKey);
  const logMode = isLogModeEnabled(domainObject, axisKey);
  const axisType = logMode ? { type: 'log', ...getLogAxisTickLayout() } : {};

  if (axis.autoscale === false && axis.range) {
    return { ...axisType, ...getAxisBoundsLayout(axis.range, logMode) };
  }

  if (underlayRange && underlayRange.min !== '' && underlayRange.max !== '') {
    // The underlay bounds come from the create form and may be strings.
    return {
      ...axisType,
      ...getAxisBoundsLayout(
        { min: Number(underlayRange.min), max: Number(underlayRange.max) },
        logMode
      )
    };
  }

  return { ...axisType, autorange: true };
}

/**
 * Tick configuration for a logarithmic axis.
 *
 * Left to itself Plotly labels every minor tick on a log axis: a three-decade
 * range renders 28 labels - 0.1, 2, 3 ... 9, 1, 2 ... 9, 10, 2 ... 9, 100 -
 * which is unreadable. `nticks` caps that density; 4 is the highest value that
 * still yields one label per decade from three decades up. The `minor` block
 * keeps the fine gridlines, unlabelled, as reference lines.
 *
 * Returned fresh each call because Plotly normalises the layout object it is
 * given.
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
 * Build the Plotly layout describing an axis's bounds.
 *
 * Fixed scaling requires both bounds, so anything less autoranges. Bounds are
 * given to Plotly in LOG units when the axis type is `log`: verified against
 * plotly.js-basic-dist-min@2.29.1, a `range` of [1, 1000] on a log axis draws
 * an axis from 10^1 to 10^1000.
 *
 * @param {{min: ?number, max: ?number}} range the configured range, in data units
 * @param {boolean} logMode whether the axis is logarithmic
 * @returns {Object} the bounds portion of a Plotly axis layout
 */
export function getAxisBoundsLayout(range, logMode) {
  // A log axis cannot draw a value of zero, but an operator comparing spectra
  // still wants the axis anchored and labelled at 0 - it keeps the viewport
  // locked and reads naturally. Honour that: floor the drawable area just below
  // the lowest labelled decade and label the floor "0". Values of zero still
  // cannot be drawn there, which the inspector says when log mode is enabled.
  if (logMode && range?.min === 0 && isBoundSet(range?.max) && range.max > 0) {
    return getZeroAnchoredLogLayout(range.max);
  }

  if (!isUsableBound(range?.min, logMode) || !isUsableBound(range?.max, logMode)) {
    return { autorange: true };
  }

  return {
    autorange: false,
    range: [toAxisUnits(range.min, logMode), toAxisUnits(range.max, logMode)]
  };
}

/**
 * How far below the lowest labelled decade the "0" anchor sits, in decades.
 * Small enough that it does not waste plot height, large enough that the label
 * clears the one above it.
 */
const ZERO_ANCHOR_DECADES = 0.4;

/**
 * A log axis running from a labelled "0" up to `max`.
 *
 * The floor is placed a fraction of a decade below the lowest labelled decade,
 * which is itself derived from `max` - at least one decade below it, and never
 * above 1. Deriving it rather than fixing it at 1 is what keeps a `max` below 1
 * working: a descending `range` is read by Plotly as an instruction to invert
 * the axis, and a floor that never moves would produce one.
 *
 * Above the floor, ticks suit how many decades are on screen: a narrow axis
 * gets 1-2-5 steps within each decade, a wide one only decades, and a very wide
 * one every second or third decade.
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
  const maxExponent = Math.floor(Math.log10(max));
  const bottomExponent = Math.min(0, maxExponent - 1);
  const floorExponent = bottomExponent - ZERO_ANCHOR_DECADES;
  const decades = Math.log10(max) - floorExponent;
  const mantissas = decades <= 3 ? [1, 2, 5] : [1];
  const stride = decades <= 6 ? 1 : Math.ceil(decades / 6);

  const tickvals = [Math.pow(10, floorExponent)];
  const ticktext = ['0'];

  // Starting at `bottomExponent` puts the first tick exactly
  // ZERO_ANCHOR_DECADES above the floor, so "0" always has room to breathe. A
  // stride above 1 needs `decades` above 6, which only happens when
  // `bottomExponent` is 0, so the sequence still lands on 1.
  for (let exponent = bottomExponent; exponent <= maxExponent; exponent += stride) {
    for (const mantissa of mantissas) {
      const value = Number((mantissa * Math.pow(10, exponent)).toPrecision(12));
      if (value > max) {
        continue;
      }

      tickvals.push(value);
      ticktext.push(formatTick(value));
    }
  }

  // Always label the configured maximum. A fixed axis whose top edge carries no
  // label reads as unfinished, and a stride will not always land on it - a
  // 0 to 1e9 axis steps 1, 100, 10k, 1M, 100M and stops short.
  if (tickvals[tickvals.length - 1] !== max) {
    tickvals.push(max);
    ticktext.push(formatTick(max));
  }

  return {
    autorange: false,
    range: [floorExponent, Math.log10(max)],
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
 * one - autorange rather than hand Plotly an infinite bound.
 */
function isUsableBound(value, logMode) {
  return isBoundSet(value) && (!logMode || isPlottableOnLogAxis(value));
}
