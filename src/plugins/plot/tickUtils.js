import _ from 'lodash';

import { antisymlog, symlog } from './mathUtils.js';

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

/**
 * Mantissa sets used to generate log ticks, ordered coarsest to finest. Only
 * the first is combined with an exponent stride; the rest always step a single
 * decade at a time.
 */
const LOG_MANTISSA_SETS = [[1], [1, 3], [1, 2, 5], [1, 2, 3, 5, 7], [1, 2, 3, 4, 5, 6, 7, 8, 9]];

/**
 * Exponent strides tried with the [1] mantissa set, coarsest first, so that
 * ranges spanning many decades can label every second, third, ... decade.
 */
const LOG_EXPONENT_STRIDES = [12, 9, 6, 4, 3, 2, 1];

/**
 * Minimum separation between labelled log ticks, as a fraction of the axis
 * span, scaled by the desired tick count.
 */
const LOG_MAJOR_SPACING = 0.6;

/**
 * Minimum separation between log gridlines (including unlabelled minor ones),
 * as a fraction of the axis span.
 */
const LOG_MINOR_SPACING = 0.012;

// A complete list of time units and their duration in milliseconds - UTC
const TIME_UNITS_UTC = [
  { unit: 'millisecond', duration: 1 },
  { unit: 'second', duration: 1000 },
  { unit: 'minute', duration: 1000 * 60 },
  { unit: 'hour', duration: 1000 * 60 * 60 },
  { unit: 'day', duration: 1000 * 60 * 60 * 24 },
  { unit: 'week', duration: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'month', duration: 1000 * 60 * 60 * 24 * 30.4375 }, // Average month
  { unit: 'year', duration: 1000 * 60 * 60 * 24 * 365.25 } // Average year
];

/**
 * Nicely formatted tick steps from d3-array.
 */
function tickStep(start, stop, count) {
  const step0 = Math.abs(stop - start) / Math.max(0, count);
  let step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
  const error = step0 / step1;
  if (error >= e10) {
    step1 *= 10;
  } else if (error >= e5) {
    step1 *= 5;
  } else if (error >= e2) {
    step1 *= 2;
  }

  return stop < start ? -step1 : step1;
}

/**
 * tickStep for time units - allows for snapping to 15/30 minutes and 6/12 hours, which are common intervals.
 */
function timeTickStep(start, stop, count, unitName) {
  const step0 = Math.abs(stop - start) / Math.max(0, count);
  let step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
  const error = step0 / step1;

  // For minutes and seconds, allow snapping to 15 and 30
  if (unitName === 'minute' || unitName === 'second') {
    // Snap to 1 hour/minute
    if (error >= 45) {
      return 60;
    }
    // Snap to 30s/30m
    if (error >= 22.5) {
      return 30;
    }
    // Snap to 15s/15m
    if (error >= 12.5) {
      return 15;
    }
  }

  // For hours, use to 6 and 12
  if (unitName === 'hour') {
    // Snap to 1 day
    if (error >= 18) {
      return 24;
    }
    if (error >= 9) {
      return 12;
    }
    if (error >= 4.5) {
      return 6;
    }
  }

  // Fallback to standard tickStep that already snaps to 1, 2, 5, 10
  if (error >= 7.5) {
    step1 *= 10;
  } else if (error >= 3.0) {
    step1 *= 5;
  } else if (error >= 1.5) {
    step1 *= 2;
  }

  return stop < start ? -step1 : step1;
}

/**
 * Generate time ticks based on a start and stop time, and a desired count of ticks calculated proactively from canvas size
 * @param start beginning timestamp in Ms
 * @param stop  ending timestamp in Ms
 * @param count desired number of ticks
 * @returns {*[]} Array of timestamps in Ms
 */
export function getTimeTicks(start, stop, count) {
  const duration = stop - start;
  let bestUnit = TIME_UNITS_UTC[0];

  // Find the unit where the duration divided by unit size is closest to our target count.
  for (const unit of TIME_UNITS_UTC) {
    const ticksForUnit = duration / unit.duration;
    if (ticksForUnit <= count) {
      break;
    }
    bestUnit = unit;
  }

  // Normalize the range to the selected unit to find a "nice" step size
  const startInUnits = start / bestUnit.duration;
  const stopInUnits = stop / bestUnit.duration;

  // Use specialized time stepping for seconds/minutes/hours
  const bestStepSize = Math.abs(timeTickStep(startInUnits, stopInUnits, count, bestUnit.unit));

  if (bestUnit.unit === 'month' || bestUnit.unit === 'year') {
    return generateMonthYearTicks(start, stop, bestUnit.unit, bestStepSize);
  } else {
    return generateFixedIntervalTicks(start, stop, bestUnit.duration * bestStepSize);
  }
}

// Helper for variable-duration units (months, years)
/**
 * Generate ticks for month/year intervals - these are variable due to leap years etc.
 * @param start beginning timestamp in Ms
 * @param stop ending timestamp in Ms
 * @param unit 'month' or 'year'
 * @param stepSize number of months/years to step
 * @returns {*[]} Array of timestamps in Ms
 */
function generateMonthYearTicks(start, stop, unit, stepSize) {
  const resultingTicks = [];
  let currentDate = new Date(start);

  // Use UTC to avoid DST issues.
  // Set to the beginning of the interval (e.g., beginning of the month/year)
  if (unit === 'month') {
    // currentDate.setDate(1);
    currentDate.setUTCDate(1);
    currentDate.setUTCHours(0, 0, 0, 0);
  } else if (unit === 'year') {
    // currentDate.setMonth(0, 1);
    currentDate.setUTCMonth(0, 1);
    currentDate.setUTCHours(0, 0, 0, 0);
  }

  while (currentDate.getTime() <= stop) {
    resultingTicks.push(currentDate.getTime());
    if (unit === 'month') {
      // currentDate.setMonth(currentDate.getMonth() + stepSize);
      currentDate.setUTCMonth(currentDate.getUTCMonth() + stepSize);
    } else {
      // unit is 'year'
      // currentDate.setFullYear(currentDate.getFullYear() + stepSize);
      currentDate.setUTCFullYear(currentDate.getUTCFullYear() + stepSize);
    }
  }
  return resultingTicks;
}

// Helper for fixed-duration units (seconds, days)
/**
 * Generate ticks for fixed-duration intervals (seconds, minutes, hours, etc.)
 * @param start beginning timestamp in Ms
 * @param stop ending timestamp in Ms
 * @param interval duration of each tick in Ms
 * @returns {*[]} Array of timestamps in Ms
 */
function generateFixedIntervalTicks(start, stop, interval) {
  const fixedIntervalTicks = [];
  const firstTick = Math.ceil(start / interval) * interval;

  for (let i = firstTick; i <= stop; i += interval) {
    fixedIntervalTicks.push(i);
  }

  return fixedIntervalTicks;
}

/**
 * Find the precision (number of decimals) of a step.  Used to round
 * ticks to precise values.
 */
function getPrecision(step) {
  const exponential = step.toExponential();
  const i = exponential.indexOf('e');
  if (i === -1) {
    return 0;
  }

  let precision = Math.max(0, -Number(exponential.slice(i + 1)));

  if (precision > 20) {
    precision = 20;
  }

  return precision;
}

/**
 * Round away the floating point noise introduced by moving values in and out of
 * symlog space, so that a tick lands on the round number it is meant to be.
 */
function roundToSignificantDigits(value) {
  return Number(value.toPrecision(12));
}

/**
 * Enumerate `mantissa * 10^exponent` values falling within a range of positive
 * magnitudes.
 * @param {number} loMagnitude smallest magnitude to include
 * @param {number} hiMagnitude largest magnitude to include
 * @param {number[]} mantissas mantissas to use within each decade
 * @param {number} exponentStride number of decades to step between exponents
 * @returns {number[]} ascending list of nice magnitudes
 */
function decadeValues(loMagnitude, hiMagnitude, mantissas, exponentStride) {
  const values = [];
  const startExponent = Math.floor(Math.log10(loMagnitude));
  const endExponent = Math.floor(Math.log10(hiMagnitude));
  // Anchor the stride to a multiple of itself so that the chosen decades are
  // stable as the range pans, rather than shifting with the range start.
  const firstExponent = Math.floor(startExponent / exponentStride) * exponentStride;

  for (
    let exponent = firstExponent;
    exponent <= endExponent + exponentStride;
    exponent += exponentStride
  ) {
    for (const mantissa of mantissas) {
      const value = roundToSignificantDigits(mantissa * Math.pow(10, exponent));
      if (value >= loMagnitude * (1 - 1e-9) && value <= hiMagnitude * (1 + 1e-9)) {
        values.push(value);
      }
    }
  }

  return values;
}

/**
 * Build the candidate tick values for a signed data range, mirroring the nice
 * magnitudes onto the negative side of the axis.
 */
function logCandidates(bounds, mantissas, exponentStride) {
  const { minValue, maxValue, negativeMin, negativeMax, positiveMin, positiveMax } = bounds;
  const candidates = [];

  if (negativeMax > negativeMin) {
    candidates.push(
      ...decadeValues(negativeMin, negativeMax, mantissas, exponentStride).map((value) => -value)
    );
  }

  if (positiveMax > positiveMin) {
    candidates.push(...decadeValues(positiveMin, positiveMax, mantissas, exponentStride));
  }

  // antisymlog(symlog(n)) does not round trip exactly, so a tick sitting on the
  // range boundary would otherwise be discarded.
  const epsilon = 1e-9 * Math.max(Math.abs(minValue), Math.abs(maxValue));

  return [...new Set(candidates)]
    .filter((value) => value >= minValue - epsilon && value <= maxValue + epsilon)
    .sort((a, b) => a - b);
}

/**
 * Generate ticks for a log mode axis.
 *
 * Log mode does not use a log scale - values are transformed with symlog and
 * every other piece of axis math happens in that space. Ticks are therefore
 * chosen as human friendly values in data space (powers of ten, or 1-2-5 style
 * steps for narrower ranges) and then positioned at their symlog coordinate.
 * Each tick carries both, so its label is the exact round number rather than
 * the lossy result of transforming its position back again.
 *
 * @param {number} start beginning of the display range, in symlog space
 * @param {number} stop end of the display range, in symlog space
 * @param {number} tickCount desired number of labelled ticks
 * @returns {{value: number, dataValue: number, minor: boolean}[]} ticks, where
 *          `value` positions the tick and `dataValue` labels it
 */
export function getLogTicks(start, stop, tickCount = 6) {
  if (!(stop > start)) {
    return [];
  }

  const span = stop - start;
  const minValue = antisymlog(start, 10);
  const maxValue = antisymlog(stop, 10);
  const minSpacing = (LOG_MAJOR_SPACING / tickCount) * span;
  const crossesZero = minValue <= 0 && maxValue >= 0;

  // Below 1, symlog is very nearly linear, so decades pile up on the zero line.
  // symlog(v) ~= v / ln(10) for small v, so this is the smallest magnitude that
  // can still be told apart from zero.
  const zeroFloor = minSpacing * Math.LN10;
  const bounds = {
    minValue,
    maxValue,
    negativeMin: maxValue < 0 ? -maxValue : zeroFloor,
    negativeMax: minValue < 0 ? -minValue : 0,
    positiveMin: minValue > 0 ? minValue : zeroFloor,
    positiveMax: maxValue > 0 ? maxValue : 0
  };

  const configurations = [
    ...LOG_EXPONENT_STRIDES.map((exponentStride) => ({ mantissas: [1], exponentStride })),
    ...LOG_MANTISSA_SETS.slice(1).map((mantissas) => ({ mantissas, exponentStride: 1 }))
  ];

  let majorTicks;
  for (const { mantissas, exponentStride } of configurations) {
    const candidates = logCandidates(bounds, mantissas, exponentStride);
    if (candidates.length < 3) {
      continue;
    }

    // Reject a crowded configuration outright rather than thinning it out -
    // dropping individual ticks produces an irregular, arbitrary looking axis.
    const isLegible = candidates.every(
      (value, i) => i === 0 || symlog(value, 10) - symlog(candidates[i - 1], 10) >= minSpacing
    );
    if (!isLegible) {
      continue;
    }

    // Zero is optional. Insisting on it would disqualify every configuration for
    // a range like -100..100, where zero always crowds the ticks either side.
    if (crossesZero) {
      const aboveIndex = candidates.findIndex((value) => value > 0);
      const insertAt = aboveIndex < 0 ? candidates.length : aboveIndex;
      const below = insertAt > 0 ? symlog(candidates[insertAt - 1], 10) : -Infinity;
      const above = insertAt < candidates.length ? symlog(candidates[insertAt], 10) : Infinity;

      if (0 - below >= minSpacing && above - 0 >= minSpacing) {
        candidates.splice(insertAt, 0, 0);
      }
    }

    if (candidates.length <= tickCount + 1) {
      majorTicks = candidates;
    }
  }

  if (!majorTicks) {
    // Nothing nice fits, which means the range sits where symlog is effectively
    // linear - a sub-decade span, or values far below 1. Round numbers in data
    // space are the friendliest answer there.
    return ticks(minValue, maxValue, tickCount).map((dataValue) => ({
      value: symlog(dataValue, 10),
      dataValue,
      minor: false
    }));
  }

  return [
    ...majorTicks.map((dataValue) => ({ value: symlog(dataValue, 10), dataValue, minor: false })),
    ...getLogMinorTicks(bounds, majorTicks, span)
  ].sort((a, b) => a.value - b.value);
}

/**
 * Generate the unlabelled gridlines that sit between labelled log ticks.
 */
function getLogMinorTicks(bounds, majorTicks, span) {
  const minSpacing = LOG_MINOR_SPACING * span;
  const majorValues = new Set(majorTicks);
  const minorTicks = [];
  let previousPosition = -Infinity;

  for (const dataValue of logCandidates(bounds, LOG_MANTISSA_SETS.at(-1), 1)) {
    const position = symlog(dataValue, 10);

    if (majorValues.has(dataValue)) {
      previousPosition = position;
      continue;
    }

    if (position - previousPosition < minSpacing) {
      continue;
    }

    minorTicks.push({ value: position, dataValue, minor: true });
    previousPosition = position;
  }

  return minorTicks;
}

/**
 * Linear tick generation from d3-array.
 */
export function ticks(start, stop, count) {
  const step = tickStep(start, stop, count);
  const precision = getPrecision(step);

  return _.range(
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  ).map(function round(tick) {
    return Number(tick.toFixed(precision));
  });
}

export function commonPrefix(a, b) {
  const maxLen = Math.min(a.length, b?.length);
  let breakpoint = 0;
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) {
      break;
    }

    if (a[i] === ' ') {
      breakpoint = i + 1;
    }
  }

  return a.slice(0, breakpoint);
}

export function commonSuffix(a, b) {
  const maxLen = Math.min(a.length, b?.length);
  let breakpoint = 0;
  for (let i = 0; i <= maxLen; i++) {
    if (a[a.length - i] !== b[b.length - i]) {
      break;
    }

    if ('. '.indexOf(a[a.length - i]) !== -1) {
      breakpoint = i;
    }
  }

  return a.slice(a.length - breakpoint);
}

/**
 * Format a set of ticks for display, trimming any prefix and suffix they all
 * share. Accepts either plain values or the `{value, dataValue, minor}` ticks
 * produced by getLogTicks, where the value positioning the tick differs from
 * the value labelling it. Minor ticks are gridlines only, so they are left
 * unlabelled and excluded from the prefix/suffix comparison.
 */
export function getFormattedTicks(newTicks, format) {
  newTicks = newTicks.map(function (tick) {
    const isValueOnly = typeof tick !== 'object' || tick === null;
    const value = isValueOnly ? tick : tick.value;
    const dataValue = isValueOnly ? tick : tick.dataValue;
    const minor = isValueOnly ? false : Boolean(tick.minor);

    return {
      value,
      dataValue,
      minor,
      text: minor ? '' : format(dataValue)
    };
  });

  const majorTicks = newTicks.filter((t) => !t.minor);

  if (majorTicks.length && typeof majorTicks[0].text === 'string') {
    const tickText = majorTicks.map(function (t) {
      return t.text;
    });
    const prefix = tickText.reduce(commonPrefix);
    const suffix = tickText.reduce(commonSuffix);
    majorTicks.forEach(function (t) {
      t.fullText = t.text;

      if (typeof t.text === 'string') {
        if (majorTicks.length > 1) {
          if (suffix.length) {
            t.text = t.text.slice(prefix.length, -suffix.length);
          } else {
            t.text = t.text.slice(prefix.length);
          }
        }
      }
    });
  }

  return newTicks;
}

/**
 * Proactively measures text width using a canvas context.
 */
let measurementContext;

export function measureTextWidth(text, font = '12px "Helvetica", sans-serif') {
  if (!measurementContext) {
    const canvas = document.createElement('canvas');
    measurementContext = canvas.getContext('2d');
  }
  measurementContext.font = font;
  return measurementContext.measureText(text).width;
}
