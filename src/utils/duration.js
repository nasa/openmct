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

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

function normalizeAge(num) {
  const hundredtized = num * 100;
  const isWhole = hundredtized % 100 === 0;

  return isWhole ? hundredtized / 100 : num;
}

function padLeadingZeros(num, numOfLeadingZeros) {
  return num.toString().padStart(numOfLeadingZeros, '0');
}

function toDoubleDigits(num) {
  return padLeadingZeros(num, 2);
}

function toTripleDigits(num) {
  return padLeadingZeros(num, 3);
}

function addTimeSuffix(value, suffix) {
  return typeof value === 'number' && value > 0 ? `${value + suffix}` : '';
}

export function millisecondsToDHMS(numericDuration) {
  const ms = numericDuration || 0;
  const dhms = [
    addTimeSuffix(Math.floor(normalizeAge(ms / ONE_DAY)), 'd'),
    addTimeSuffix(Math.floor(normalizeAge((ms % ONE_DAY) / ONE_HOUR)), 'h'),
    addTimeSuffix(Math.floor(normalizeAge((ms % ONE_HOUR) / ONE_MINUTE)), 'm'),
    addTimeSuffix(Math.floor(normalizeAge((ms % ONE_MINUTE) / ONE_SECOND)), 's'),
    addTimeSuffix(Math.floor(normalizeAge(ms % ONE_SECOND)), 'ms')
  ]
    .filter(Boolean)
    .join(' ');

  return `${dhms ? '+' : ''} ${dhms}`;
}

/**
 *
 * @param {number} value
 * @param {Object} options
 * @param {boolean | undefined} options.excludeMilliSeconds
 * @param {boolean | undefined} options.useDayFormat
 * @returns {string}
 */
export function getPreciseDuration(
  value,
  { excludeMilliSeconds, useDayFormat } = {
    excludeMilliSeconds: null,
    useDayFormat: null
  }
) {
  let preciseDuration;
  const ms = value || 0;

  const duration = [
    Math.floor(normalizeAge(ms / ONE_DAY)),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_DAY) / ONE_HOUR))),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_HOUR) / ONE_MINUTE))),
    toDoubleDigits(Math.floor(normalizeAge((ms % ONE_MINUTE) / ONE_SECOND)))
  ];
  if (!excludeMilliSeconds) {
    duration.push(toTripleDigits(Math.floor(normalizeAge(ms % ONE_SECOND))));
  }

  if (useDayFormat) {
    // Format days as XD
    const days = duration.shift();
    if (days > 0) {
      preciseDuration = `${days}D ${duration.join(':')}`;
    } else {
      preciseDuration = duration.join(':');
    }
  } else {
    const days = toDoubleDigits(duration.shift());
    duration.unshift(days);
    preciseDuration = duration.join(':');
  }

  return preciseDuration;
}
