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

import { DateTime, Duration } from 'luxon';

/**
 * Mapping from Moment.js format tokens to Luxon format tokens.
 * Only the tokens actually used in OpenMCT are included.
 */
const MOMENT_TO_LUXON_MAP = {
  YYYY: 'yyyy',
  MM: 'MM',
  DD: 'dd',
  HH: 'HH',
  hh: 'hh',
  mm: 'mm',
  ss: 'ss',
  SSS: 'SSS',
  a: 'a',
  MMMM: 'MMMM',
  MMM: 'MMM',
  ddd: 'EEE',
  '[Z]': "'Z'"
};

/**
 * Convert a Moment.js format string to a Luxon format string.
 * @param {string} momentFormat
 * @returns {string} Luxon format string
 */
export function toLuxonFormat(momentFormat) {
  let result = momentFormat;
  // Sort by length descending to avoid partial replacements (e.g. 'MMMM' before 'MM')
  const sortedKeys = Object.keys(MOMENT_TO_LUXON_MAP).sort((a, b) => b.length - a.length);
  for (const token of sortedKeys) {
    result = result.split(token).join(MOMENT_TO_LUXON_MAP[token]);
  }

  return result;
}

/**
 * Format a UTC timestamp (ms since epoch) using a Luxon format string.
 * @param {number} value milliseconds since Unix epoch
 * @param {string} luxonFormat Luxon format string
 * @returns {string} formatted date string
 */
export function formatUtc(value, luxonFormat) {
  const millis = value instanceof Date ? value.getTime() : value;

  return DateTime.fromMillis(millis, { zone: 'utc' }).toFormat(luxonFormat);
}

/**
 * Format a local timestamp (ms since epoch) using a Luxon format string.
 * @param {number} value milliseconds since Unix epoch
 * @param {string} luxonFormat Luxon format string
 * @returns {string} formatted date string
 */
export function formatLocal(value, luxonFormat) {
  const millis = value instanceof Date ? value.getTime() : value;

  return DateTime.fromMillis(millis).toFormat(luxonFormat);
}

/**
 * Parse a date string against multiple Luxon format strings in UTC.
 * Returns the ms since epoch of the first successfully parsed format, or NaN.
 * @param {string} text the date string to parse
 * @param {string[]} luxonFormats array of Luxon format strings to try
 * @param {Object} [options] parsing options
 * @param {boolean} [options.utc=true] whether to parse in UTC
 * @returns {number} milliseconds since epoch, or NaN if no format matched
 */
export function parseMultiFormat(text, luxonFormats, { utc = true } = {}) {
  const zone = utc ? 'utc' : 'local';
  for (const fmt of luxonFormats) {
    const dt = DateTime.fromFormat(text, fmt, { zone });
    if (dt.isValid) {
      return dt.toMillis();
    }
  }

  return NaN;
}

/**
 * Validate a date string against multiple Luxon format strings.
 * @param {string} text the date string to validate
 * @param {string[]} luxonFormats array of Luxon format strings to try
 * @param {Object} [options] parsing options
 * @param {boolean} [options.utc=true] whether to validate in UTC
 * @returns {boolean} true if the text matches at least one format
 */
export function validateMultiFormat(text, luxonFormats, { utc = true } = {}) {
  const zone = utc ? 'utc' : 'local';
  return luxonFormats.some((fmt) => DateTime.fromFormat(text, fmt, { zone }).isValid);
}

/**
 * Parse a duration string in HH:mm:ss or HH:mm:ss.SSS format to milliseconds.
 * @param {string} text duration string
 * @returns {number} duration in milliseconds
 */
export function parseDuration(text) {
  const parts = text.split(':');
  if (parts.length !== 3) {
    return NaN;
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsParts = parts[2].split('.');
  const seconds = parseInt(secondsParts[0], 10);
  const millis = secondsParts.length > 1 ? parseInt(secondsParts[1].padEnd(3, '0'), 10) : 0;

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(millis)) {
    return NaN;
  }

  return Duration.fromObject({ hours, minutes, seconds, milliseconds: millis }).as('milliseconds');
}

/**
 * Get the current UTC timestamp formatted.
 * @param {string} luxonFormat Luxon format string
 * @returns {string} formatted current UTC time
 */
export function nowUtc(luxonFormat) {
  return DateTime.utc().toFormat(luxonFormat);
}
