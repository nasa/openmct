/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import moment from 'moment';

/**
 * Formatter for UTC timestamps. Interprets numeric values as
 * milliseconds since the start of 1970.
 *
 * @implements {Format}
 * @constructor
 * @memberof platform/commonUI/formats
 */
export default class UTCTimeFormat {
  constructor() {
    this.key = 'utc';
    this.DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
    this.DATE_FORMATS = {
      PRECISION_DEFAULT: this.DATE_FORMAT,
      PRECISION_DEFAULT_WITH_ZULU: this.DATE_FORMAT + 'Z',
      PRECISION_SECONDS: 'YYYY-MM-DD HH:mm:ss',
      PRECISION_MINUTES: 'YYYY-MM-DD HH:mm',
      PRECISION_DAYS: 'YYYY-MM-DD'
    };
  }

  /**
   * @param {string} formatString
   * @returns the value of formatString if the value is a string type and exists in the DATE_FORMATS array; otherwise the DATE_FORMAT value.
   */
  isValidFormatString(formatString) {
    return Object.values(this.DATE_FORMATS).includes(formatString);
  }

  /**
   * @param {number} value The value to format.
   * @returns {string} the formatted date(s). If multiple values were requested, then an array of
   * formatted values will be returned. Where a value could not be formatted, `undefined` will be returned at its position
   * in the array.
   */
  format(value, formatString) {
    if (value !== undefined) {
      const utc = moment.utc(value);

      if (formatString !== undefined && !this.isValidFormatString(formatString)) {
        throw 'Invalid format requested from UTC Time Formatter ';
      }

      let format = formatString || this.DATE_FORMATS.PRECISION_DEFAULT;

      return utc.format(format) + (formatString ? '' : 'Z');
    } else {
      return value;
    }
  }

  parse(text) {
    if (typeof text === 'number') {
      return text;
    }

    return moment.utc(text, Object.values(this.DATE_FORMATS)).valueOf();
  }

  validate(text) {
    return moment.utc(text, Object.values(this.DATE_FORMATS), true).isValid();
  }
}
