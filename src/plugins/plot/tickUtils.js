import { antisymlog, symlog } from './mathUtils.js';

const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);

// A complete list of time units and their duration in milliseconds
const TIME_UNITS = [
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
 * Generate time ticks based on a start and stop time, and a desired count of ticks.
 * @param start beginning timestamp in Ms
 * @param stop  ending timestamp in Ms
 * @param count desired number of ticks
 * @returns {*[]} Array of timestamps in Ms
 */
export function getTimeTicks(start, stop, count) {
  const duration = stop - start;
  let bestUnit = TIME_UNITS[0];
  let bestStepSize = 1;

  // Find the most appropriate time unit
  for (const unit of TIME_UNITS) {
    const numTicks = duration / unit.duration;
    if (numTicks >= count / 2) {
      // Find the unit that gives at least half the desired ticks
      bestUnit = unit;
      bestStepSize = Math.ceil(numTicks / count) || 1;
    } else {
      break; // Stop when the unit is too large
    }
  }

  // Handle month/year to avoid incorrect step sizes due to varying durations
  if (bestUnit.unit === 'month' || bestUnit.unit === 'year') {
    return generateMonthYearTicks(start, stop, bestUnit.unit, bestStepSize);
  } else {
    // For smaller, fixed-duration units
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

  // Set to the beginning of the interval (e.g., beginning of the month/year)
  if (unit === 'month') {
    currentDate.setDate(1);
  } else if (unit === 'year') {
    currentDate.setMonth(0, 1);
  }

  while (currentDate.getTime() <= stop) {
    resultingTicks.push(currentDate.getTime());
    if (unit === 'month') {
      currentDate.setMonth(currentDate.getMonth() + stepSize);
    } else {
      // unit is 'year'
      currentDate.setFullYear(currentDate.getFullYear() + stepSize);
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
