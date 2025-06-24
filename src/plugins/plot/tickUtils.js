import { antisymlog, symlog } from './mathUtils.js';

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);
/**
 * Common time intervals in milliseconds for automatic tick generation.
 * These are chosen to be "nice" human-readable intervals.
 */
const COMMON_INTERVALS_MS = [
  1 * 1000, // 1 second
  5 * 1000, // 5 seconds
  10 * 1000, // 10 seconds
  15 * 1000, // 15 seconds
  30 * 1000, // 30 seconds
  45 * 1000, // 45 seconds
  1 * 60 * 1000, // 1 minute
  2 * 60 * 1000, // 2 minutes
  3 * 60 * 1000, // 3 minutes
  4 * 60 * 1000, // 4 minutes
  5 * 60 * 1000, // 5 minutes
  10 * 60 * 1000, // 10 minutes
  15 * 60 * 1000, // 15 minutes
  30 * 60 * 1000, // 30 minutes
  45 * 60 * 1000, // 45 minutes
  1 * 60 * 60 * 1000, // 1 hour
  2 * 60 * 60 * 1000, // 2 hour
  3 * 60 * 60 * 1000, // 3 hour
  4 * 60 * 60 * 1000, // 4 hours
  5 * 60 * 60 * 1000, // 5 hours
  6 * 60 * 60 * 1000, // 6 hours
  10 * 60 * 60 * 1000, // 10 hours
  12 * 60 * 60 * 1000, // 12 hours
  1 * 24 * 60 * 60 * 1000, // 1 day
  7 * 24 * 60 * 60 * 1000, // 1 week
  14 * 24 * 60 * 60 * 1000, // 2 weeks
  30 * 24 * 60 * 60 * 1000, // ~1 month (30 days approximation)
  90 * 24 * 60 * 60 * 1000, // ~3 months
  180 * 24 * 60 * 60 * 1000, // ~6 months
  365 * 24 * 60 * 60 * 1000 // ~1 year (365 days approximation)
];

/**
 * Determines an optimal interval for time ticks based on the total duration
 * and a desired number of ticks.
 *
 * @param {number} durationMs The total duration in milliseconds.
 * @param {number} tickCount The approximate number of ticks desired.
 * @returns {number} The optimal interval in milliseconds from COMMON_INTERVALS_MS.
 */
function determineOptimalInterval(durationMs, tickCount) {
  if (tickCount <= 0 || durationMs <= 0) {
    return COMMON_INTERVALS_MS[0]; // Default to 15 seconds if invalid input
  }

  const targetInterval = durationMs / tickCount;

  // Find the smallest common interval that is greater than or equal to the target
  const commonIntervalsLength = COMMON_INTERVALS_MS.length;
  for (let i = 0; i < commonIntervalsLength; i++) {
    if (COMMON_INTERVALS_MS[i] >= targetInterval) {
      return COMMON_INTERVALS_MS[i];
    }
  }

  // If the range is very large and exceeds all common intervals, return the largest one
  return COMMON_INTERVALS_MS[commonIntervalsLength - 1];
}

/**
 * Generates an array of timestamps (in milliseconds) at automatically determined intervals.
 *
 * @param {number} startTimestampMs The starting timestamp in milliseconds.
 * @param {number} stopTimestampMs The stopping timestamp in milliseconds.
 * @param {number} [tickCount=12] The approximate number of ticks desired.
 * The actual number may vary based on optimal interval selection.
 * @returns {number[]} An array of timestamps in milliseconds.
 */
export function generateTimestampTicks(startTimestampMs, stopTimestampMs, tickCount = 12) {
  // Ensure start and stop are valid numbers
  if (isNaN(startTimestampMs) || isNaN(stopTimestampMs)) {
    console.error('Invalid start or stop timestamp provided.');
    return [];
  }

  // Start is after stop or duration is zero/negative
  if (startTimestampMs > stopTimestampMs) {
    return [];
  }

  const duration = stopTimestampMs - startTimestampMs;

  // Determine the optimal tick step based on the duration and desired tick count
  const intervalMs = determineOptimalInterval(duration, tickCount);

  // If for some reason intervalMs becomes 0 or negative
  if (intervalMs <= 0) {
    console.warn('Calculated interval is invalid. Returning empty ticks.');
    return [];
  }

  const resultingTicks = [];

  // Calculate the first tick timestamp that is aligned to the 'intervalMs'
  // and is on or after the startTimestampMs.
  let firstTickMs;
  // Calculate remainder to ensure consistent alignment
  const remainder = startTimestampMs % intervalMs;

  if (remainder === 0) {
    firstTickMs = startTimestampMs;
  } else {
    // Adjust to the next full interval mark
    firstTickMs = startTimestampMs - remainder + intervalMs;
  }

  // Edge case - If startTimestampMs is negative, the modulo result can be negative.
  // Ensure firstTickMs is always on or after startTimestampMs,
  // and aligned to the interval.
  if (
    startTimestampMs < 0 &&
    firstTickMs > startTimestampMs &&
    Math.abs(firstTickMs - startTimestampMs) > intervalMs
  ) {
    // If firstTickMs jump too far ahead for negative numbers.
    // We want the first tick that is >= startTimestampMs.
    firstTickMs = startTimestampMs - remainder + (remainder < 0 ? 0 : intervalMs);
    if (firstTickMs < startTimestampMs) {
      firstTickMs += intervalMs;
    }
  }

  // If the range is very small, ensure firstTickMs doesn't go beyond stopTimestampMs
  if (firstTickMs > stopTimestampMs) {
    return resultingTicks; // No ticks can be generated within the range
  }

  // Generate ticks
  for (
    let currentTimeMs = firstTickMs;
    currentTimeMs <= stopTimestampMs;
    currentTimeMs += intervalMs
  ) {
    resultingTicks.push(currentTimeMs);
  }

  return resultingTicks;
}

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

export function getLogTicks(start, stop, mainTickCount = 8, secondaryTickCount = 6) {
  // log()'ed values
  const mainLogTicks = ticks(start, stop, mainTickCount);

  // original values
  const mainTicks = mainLogTicks.map((n) => antisymlog(n, 10));

  const result = [];

  let i = 0;
  for (const logTick of mainLogTicks) {
    result.push(logTick);

    if (i === mainLogTicks.length - 1) {
      break;
    }

    const tick = mainTicks[i];
    const nextTick = mainTicks[i + 1];
    const rangeBetweenMainTicks = nextTick - tick;

    const secondaryLogTicks = ticks(
      tick + rangeBetweenMainTicks / (secondaryTickCount + 1),
      nextTick - rangeBetweenMainTicks / (secondaryTickCount + 1),
      secondaryTickCount - 2
    ).map((n) => symlog(n, 10));

    result.push(...secondaryLogTicks);

    i++;
  }

  return result;
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
  const maxLen = Math.min(a.length, b.length);
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
  const maxLen = Math.min(a.length, b.length);
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

export function getFormattedTicks(newTicks, format) {
  newTicks = newTicks.map(function (tickValue) {
    return {
      value: tickValue,
      text: format(tickValue)
    };
  });

  if (newTicks.length && typeof newTicks[0].text === 'string') {
    const tickText = newTicks.map(function (t) {
      return t.text;
    });
    const prefix = tickText.reduce(commonPrefix);
    const suffix = tickText.reduce(commonSuffix);
    newTicks.forEach(function (t) {
      t.fullText = t.text;

      if (typeof t.text === 'string') {
        if (suffix.length) {
          t.text = t.text.slice(prefix.length, -suffix.length);
        } else {
          t.text = t.text.slice(prefix.length);
        }
      }
    });
  }

  return newTicks;
}
