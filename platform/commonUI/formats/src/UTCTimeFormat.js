/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    }

    /**
     * Returns an appropriate time format based on the provided value and
     * the threshold required.
     * @private
     */
    function getScaledFormat(d) {
        var momentified = moment.utc(d);
        /**
         * Uses logic from d3 Time-Scales, v3 of the API. See
         * https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Scales.md
         *
         * Licensed
         */
        return [
            [".SSS", function (m) {
                return m.milliseconds();
            }],
            [":ss", function (m) {
                return m.seconds();
            }],
            ["HH:mm", function (m) {
                return m.minutes();
            }],
            ["HH", function (m) {
                return m.hours();
            }],
            ["ddd DD", function (m) {
                return m.days() &&
                    m.date() !== 1;
            }],
            ["MMM DD", function (m) {
                return m.date() !== 1;
            }],
            ["MMMM", function (m) {
                return m.month();
            }],
            ["YYYY", function () {
                return true;
            }]
        ].filter(function (row) {
            return row[1](momentified);
        })[0][0];
    }

    /**
     * Returns a description of the current range of the time conductor's
     * bounds.
     * @param timeRange
     * @returns {*}
     */
    UTCTimeFormat.prototype.timeUnits = function (timeRange) {
        var momentified = moment.duration(timeRange);

        return [
            ["Decades", function (r) {
                return r.years() > 15;
            }],
            ["Years", function (r) {
                return r.years() > 1;
            }],
            ["Months", function (r) {
                return r.years() === 1 || r.months() > 1;
            }],
            ["Days", function (r) {
                return r.months() === 1 || r.days() > 1;
            }],
            ["Hours", function (r) {
                return r.days() === 1 || r.hours() > 1;
            }],
            ["Minutes", function (r) {
                return r.hours() === 1 || r.minutes() > 1;
            }],
            ["Seconds", function (r) {
                return r.minutes() === 1 || r.seconds() > 1;
            }],
            ["Milliseconds", function (r) {
                return true;
            }]
        ].filter(function (row) {
            return row[1](momentified);
        })[0][0];
    };

    /**
     *
     * @param value
     * @param {Scale} [scale] Optionally provides context to the
     * format request, allowing for scale-appropriate formatting.
     * @returns {string} the formatted date
     */
    UTCTimeFormat.prototype.format = function (value, scale) {
        if (scale !== undefined) {
            var scaledFormat = getScaledFormat(value, scale);
            if (scaledFormat) {
                return moment.utc(value).format(scaledFormat);
            }
        }
        return moment.utc(value).format(DATE_FORMAT) + "Z";
    };

    UTCTimeFormat.prototype.parse = function (text) {
        return moment.utc(text, DATE_FORMATS).valueOf();
    };

    UTCTimeFormat.prototype.validate = function (text) {
        return moment.utc(text, DATE_FORMATS).isValid();
    };

    return UTCTimeFormat;
});
