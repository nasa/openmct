/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { formatLocal, parseMultiFormat, validateMultiFormat } from '../../utils/time.js';

const DATE_FORMAT = 'yyyy-MM-dd h:mm:ss.SSS a';

const DATE_FORMATS = [DATE_FORMAT, 'yyyy-MM-dd h:mm:ss a', 'yyyy-MM-dd h:mm a', 'yyyy-MM-dd'];

/**
 * @typedef Scale
 * @property {number} min the minimum scale value, in ms
 * @property {number} max the maximum scale value, in ms
 */

/**
 * Formatter for local timestamps. Interprets numeric values as
 * milliseconds since the start of 1970.
 *
 * @implements {Format}
 * @constructor
 */
export default function LocalTimeFormat() {
  this.key = 'local-format';
}

/**
 *
 * @param value
 * @returns {string} the formatted date
 */
LocalTimeFormat.prototype.format = function (value, scale) {
  return formatLocal(value, DATE_FORMAT);
};

LocalTimeFormat.prototype.parse = function (text) {
  if (typeof text === 'number') {
    return text;
  }

  return parseMultiFormat(text, DATE_FORMATS, { utc: false });
};

LocalTimeFormat.prototype.validate = function (text) {
  return validateMultiFormat(text, DATE_FORMATS, { utc: false });
};
