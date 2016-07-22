/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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

    var MS = 1,
        SECONDS = 1000 * MS,
        MINUTES = 60 * SECONDS,
        HOURS = 60 * MINUTES,
        DAYS = 24 * HOURS,
        MONTHS = (365 / 12) * DAYS;

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
    function getScaledFormat (d, threshold) {
        //Adapted from D3 formatting rules
        if (!(d instanceof Date)){
            d = new Date(moment.utc(d));
        }
        return [
            [".SSS", function(d) { return d.getMilliseconds() >= threshold; }],
            [":ss", function(d) { return d.getSeconds() * SECONDS >= threshold; }],
            ["HH:mm", function(d) { return d.getMinutes() * MINUTES >= threshold; }],
            ["HH", function(d) { return d.getHours() * HOURS >= threshold; }],
            ["ddd DD", function(d) {
                return d.getDay() * DAYS >= threshold &&
                    d.getDate() != 1;
            }],
            ["MMM DD", function(d) { return d.getDate() != 1; }],
            ["MMMM", function(d) {
                return d.getMonth() * MONTHS >= threshold;
            }],
            ["YYYY", function() { return true; }]
        ].filter(function (row){
            return row[1](d);
        })[0][0];
    };

    /**
     *
     * @param value
     * @param {number} [threshold] Optionally provides context to the
     * format request, allowing for scale-appropriate formatting. This value
     * should be the minimum unit to be represented by this format, in ms. For
     * example, to display seconds, a threshold of 1 * 1000 should be provided.
     * @returns {string} the formatted date
     */
    UTCTimeFormat.prototype.format = function (value, threshold) {
        if (threshold !== undefined){
            var scaledFormat = getScaledFormat(value, threshold);
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
