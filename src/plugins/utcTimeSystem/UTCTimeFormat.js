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

import {
  formatUtc,
  parseMultiFormat,
  validateMultiFormat,
  toLuxonFormat
} from '../../utils/time.js';

/**
 * Formatter for UTC timestamps. Interprets numeric values as
 * milliseconds since the start of 1970.
 *
 * @implements {Format}
 * @constructor
 */
export default class UTCTimeFormat {
  constructor() {
    this.key = 'utc';
    this.DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';
    this.DATE_FORMATS = {
      PRECISION_DEFAULT: this.DATE_FORMAT,
      PRECISION_DEFAULT_WITH_ZULU: `${this.DATE_FORMAT}Z`,
      PRECISION_DEFAULT_WITH_ZULU_LUXON: `${this.DATE_FORMAT}'Z'`,
      PRECISION_SECONDS: 'yyyy-MM-dd HH:mm:ss',
      PRECISION_MINUTES: 'yyyy-MM-dd HH:mm',
      PRECISION_DAYS: 'yyyy-MM-dd',
      PRECISION_SECONDS_TIME_ONLY: 'HH:mm:ss',
      PRECISION_MINUTES_TIME_ONLY: 'HH:mm'
    };
    // Keep legacy Moment format strings mapped for backwards compatibility
    // with callers that pass Moment-style format strings directly.
    this._legacyFormats = {
      'YYYY-MM-DD HH:mm:ss.SSS': this.DATE_FORMATS.PRECISION_DEFAULT,
      'YYYY-MM-DD HH:mm:ss.SSSZ': this.DATE_FORMATS.PRECISION_DEFAULT_WITH_ZULU,
      [`YYYY-MM-DD HH:mm:ss.SSS[Z]`]: this.DATE_FORMATS.PRECISION_DEFAULT_WITH_ZULU_LUXON,
      'YYYY-MM-DD HH:mm:ss': this.DATE_FORMATS.PRECISION_SECONDS,
      'YYYY-MM-DD HH:mm': this.DATE_FORMATS.PRECISION_MINUTES,
      'YYYY-MM-DD': this.DATE_FORMATS.PRECISION_DAYS,
      'HH:mm:ss': this.DATE_FORMATS.PRECISION_SECONDS_TIME_ONLY,
      'HH:mm': this.DATE_FORMATS.PRECISION_MINUTES_TIME_ONLY
    };
  }

  /**
   * Normalize a format string, converting legacy Moment tokens to Luxon if needed.
   * @param {string} formatString
   * @returns {string} Luxon-compatible format string
   */
  _normalizeFormat(formatString) {
    if (this._legacyFormats[formatString]) {
      return this._legacyFormats[formatString];
    }

    if (Object.values(this.DATE_FORMATS).includes(formatString)) {
      return formatString;
    }

    // Auto-convert any remaining Moment format strings
    return toLuxonFormat(formatString);
  }

  /**
   * @param {string} formatString
   * @returns the value of formatString if the value is a string type and exists in the DATE_FORMATS array; otherwise the DATE_FORMAT value.
   */
  isValidFormatString(formatString) {
    return (
      Object.values(this.DATE_FORMATS).includes(formatString) ||
      this._legacyFormats[formatString] !== undefined
    );
  }

  /**
   * @param {number} value The value to format.
   * @param {string} formatString The format string to use for formatting.
   * @returns {string} the formatted date(s). If multiple values were requested, then an array of
   * formatted values will be returned. Where a value could not be formatted, `undefined` will be returned at its position
   * in the array.
   */
  format(value, formatString) {
    if (value !== undefined) {
      const format = formatString
        ? this._normalizeFormat(formatString)
        : this.DATE_FORMATS.PRECISION_DEFAULT_WITH_ZULU_LUXON;

      return formatUtc(value, format);
    }
  }

  /**
   * Optional formatting method that allows for splitting date and time into separate inputs
   * Allows for easier manipulation of date or time
   * @param {number} value The value to format.
   * @returns {string} the formatted date.
   */
  formatDate(value) {
    return this.format(value, this.DATE_FORMATS.PRECISION_DAYS);
  }

  /**
   * @param {number|string} text The text to parse.
   * @param {string} formatString The format string to use for parsing.
   * @returns {number} the value parsed from the text.
   * If the text is a number, it is returned as is.
   */
  parse(text, formatString) {
    if (typeof text === 'number') {
      return text;
    }

    if (typeof text !== 'string') {
      return NaN;
    }

    return parseMultiFormat(text, Object.values(this.DATE_FORMATS));
  }

  validate(text) {
    if (typeof text !== 'string') {
      return false;
    }

    return validateMultiFormat(text, Object.values(this.DATE_FORMATS));
  }
}
