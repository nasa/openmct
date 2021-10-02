/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'moment'
], function (
    moment
) {

    var DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS",
        DATE_FORMATS = [
            DATE_FORMAT,
            DATE_FORMAT + "Z",
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD HH:mm",
            "YYYY-MM-DD"
        ];

    /**
     * @typedef Scale
     * @property {number} min the minimum scale value, in ms
     * @property {number} max the maximum scale value, in ms
     */

    /**
     * Formatter for UTC timestamps. Interprets numeric values as
     * milliseconds since the start of 1970.
     *
     * @implements {Format}
     * @constructor
     * @memberof platform/commonUI/formats
     */
    function UTCTimeFormat() {
        this.key = "utc";
    }

    /**
     * @param {number} value The value to format.
     * @param {number} formatId The format id to format.
     * The format ids:
     * undefined - "YYYY-MM-DD HH:mm:ss.SSS" + "Z"
     * 0 - "YYYY-MM-DD HH:mm:ss.SSS"
     * 1 - "YYYY-MM-DD HH:mm:ss.SSSZ"
     * 2 - "YYYY-MM-DD HH:mm:ss"
     * 3 - "YYYY-MM-DD HH:mm"
     * 4 - "YYYY-MM-DD"
     * @returns {string} the formatted date(s) - "YYYY-MM-DD HH:mm:ss.SSS" + "Z". If multiple values were requested, then an array of
     * formatted values will be returned. Where a value could not be formatted, `undefined` will be returned at its position
     * in the array.
     */
    UTCTimeFormat.prototype.format = function (value, formatId) {
        if (value !== undefined) {
            return formatId ? moment.utc(value).format(DATE_FORMATS[formatId]) : moment.utc(value).format(DATE_FORMAT) + "Z";
        } else {
            return value;
        }
    };

    UTCTimeFormat.prototype.parse = function (text) {
        if (typeof text === 'number') {
            return text;
        }

        return moment.utc(text, DATE_FORMATS).valueOf();
    };

    UTCTimeFormat.prototype.validate = function (text) {
        return moment.utc(text, DATE_FORMATS, true).isValid();
    };

    return UTCTimeFormat;
});
