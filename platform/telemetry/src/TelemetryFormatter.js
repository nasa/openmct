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
/*global define,moment*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        // Date format to use for domain values; in particular,
        // use day-of-year instead of month/day
        var DATE_FORMAT = "YYYY-DDD HH:mm:ss",
            VALUE_FORMAT_DIGITS = 3;

        /**
         * The TelemetryFormatter is responsible for formatting (as text
         * for display) values along either the domain (usually time) or
         * the range (usually value) of a data series.
         * @memberof platform/telemetry
         * @constructor
         */
        function TelemetryFormatter() {
            function formatDomainValue(v, key) {
                return isNaN(v) ? "" : moment.utc(v).format(DATE_FORMAT);
            }

            function formatRangeValue(v, key) {
                return isNaN(v) ? v : v.toFixed(3);
            }

            return {
                /**
                 * Format a domain value.
                 * @param {number} v the domain value; a timestamp
                 *        in milliseconds since start of 1970
                 * @param {string} [key] the key which identifies the
                 *        domain; if unspecified or unknown, this will
                 *        be treated as a standard timestamp.
                 * @returns {string} a textual representation of the
                 *        data and time, suitable for display.
                 * @memberof platform/telemetry.TelemetryFormatter#
                 */
                formatDomainValue: formatDomainValue,
                /**
                 * Format a range value.
                 * @param {number} v the range value; a numeric value
                 * @param {string} [key] the key which identifies the
                 *        range; if unspecified or unknown, this will
                 *        be treated as a numeric value.
                 * @returns {string} a textual representation of the
                 *        value, suitable for display.
                 * @memberof platform/telemetry.TelemetryFormatter#
                 */
                formatRangeValue: formatRangeValue
            };
        }

        return TelemetryFormatter;
    }
);
