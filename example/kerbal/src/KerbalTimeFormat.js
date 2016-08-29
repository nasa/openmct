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

define([], function () {
    // NOTE: Calendar information used for Kerbal can be found here - http://wiki.kerbalspaceprogram.com/wiki/Time
    var ONE_MILLISECOND = 1,
        ONE_SECOND = 1000 * ONE_MILLISECOND,
        ONE_MINUTE = 60 * ONE_SECOND,
        ONE_HOUR = 60 * ONE_MINUTE,
        ONE_DAY = 6.0000469395 * ONE_HOUR,
        ONE_MONTH = 6.4333383663 * ONE_DAY,
        ONE_YEAR = 66.23 * ONE_MONTH;

    /**
     * Formatter for Kerbal based timestamps. Interprets numeric values as
     * seconds since the start of year 1.
     *
     * @implements {Format}
     * @constructor
     * @memberof platform/commonUI/formats
     */
    function KerbalTimeFormat() {
    }

    /**
     * Adds leading zeros to pad numbers
     * @param {num} the number to be formatted
     * @param {size} the minimum length of the number
     *
     * returns String
     */
    function pad(num, size) {
        var s = num + '';
        while (s.length < size) { s = '0' + s };
        return s;
    }

    KerbalTimeFormat.prototype.format = function (value) {
        var YEAR = KerbalTimeFormat.prototype.getFullYear(value) + 1,
            DAY_OF_YEAR = pad(KerbalTimeFormat.prototype.getDayOfYear(value) + 1, 2),
            HOURS = pad(KerbalTimeFormat.prototype.getHours(value), 2),
            MINUTES = pad(KerbalTimeFormat.prototype.getMinutes(value), 2),
            SECONDS = pad(KerbalTimeFormat.prototype.getSeconds(value), 2);

        // Y{Y}, D{DD}, {H}:{MM}:{SS}
        return 'Y' + YEAR + ', ' + 'D' + DAY_OF_YEAR + ', ' + HOURS + ':' + MINUTES + ':' + SECONDS;
    };

    KerbalTimeFormat.prototype.parse = function (text) {
        return parseFloat(text);
    };

    KerbalTimeFormat.prototype.validate = function (text) {
        return !!isNaN(text);
    };

    KerbalTimeFormat.prototype.getFullYear = function (value) {
        return Math.floor(
            parseFloat(value) / ONE_YEAR
        );
    };

    KerbalTimeFormat.prototype.getMonth = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
            )   / ONE_MONTH
        );
    };

    KerbalTimeFormat.prototype.getDayOfYear = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
            )   / ONE_DAY
        );
    };

    KerbalTimeFormat.prototype.getDay = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
                - (KerbalTimeFormat.prototype.getMonth(value) * ONE_MONTH)
            )   / ONE_DAY
        );
    };

    KerbalTimeFormat.prototype.getHours = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
                - (KerbalTimeFormat.prototype.getMonth(value) * ONE_MONTH)
                - (KerbalTimeFormat.prototype.getDay(value) * ONE_DAY)
            )   / ONE_HOUR
        );
    };

    KerbalTimeFormat.prototype.getMinutes = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
                - (KerbalTimeFormat.prototype.getMonth(value) * ONE_MONTH)
                - (KerbalTimeFormat.prototype.getDay(value) * ONE_DAY)
                - (KerbalTimeFormat.prototype.getHours(value) * ONE_HOUR)
            )   / ONE_MINUTE
        );
    };

    KerbalTimeFormat.prototype.getSeconds = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
                - (KerbalTimeFormat.prototype.getMonth(value) * ONE_MONTH)
                - (KerbalTimeFormat.prototype.getDay(value) * ONE_DAY)
                - (KerbalTimeFormat.prototype.getHours(value) * ONE_HOUR)
                - (KerbalTimeFormat.prototype.getMinutes(value) * ONE_MINUTE)
            )   / ONE_SECOND
        );
    };

    KerbalTimeFormat.prototype.getMilliseconds = function (value) {
        return Math.floor(
            (
                parseFloat(value)
                - (KerbalTimeFormat.prototype.getFullYear(value) * ONE_YEAR)
                - (KerbalTimeFormat.prototype.getMonth(value) * ONE_MONTH)
                - (KerbalTimeFormat.prototype.getDay(value) * ONE_DAY)
                - (KerbalTimeFormat.prototype.getHours(value) * ONE_HOUR)
                - (KerbalTimeFormat.prototype.getMinutes(value) * ONE_MINUTE)
                - (KerbalTimeFormat.prototype.getSeconds(value) * ONE_SECOND)
            )   / ONE_MILLISECOND
        );
    };

    return KerbalTimeFormat;
});
