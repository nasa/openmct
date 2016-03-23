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
/*global define*/

define(
    [],
    function () {
        'use strict';

        var DIGITS = 3;

        /**
         * Wraps a `TelemetryFormatter` to provide formats for domain and
         * range values; provides a single place to track domain/range
         * formats within a plot, allowing other plot elements to simply
         * request that values be formatted.
         * @constructor
         * @memberof platform/features/plot
         * @implements {platform/telemetry.TelemetryFormatter}
         * @param {TelemetryFormatter} telemetryFormatter the formatter
         *        to wrap.
         */
        function PlotTelemetryFormatter(telemetryFormatter) {
            this.telemetryFormatter = telemetryFormatter;
        }

        /**
         * Specify the format to use for domain values.
         * @param {string} key the format's identifier
         */
        PlotTelemetryFormatter.prototype.setDomainFormat = function (key) {
            this.domainFormat = key;
        };

        /**
         * Specify the format to use for range values.
         * @param {string} key the format's identifier
         */
        PlotTelemetryFormatter.prototype.setRangeFormat = function (key) {
            this.rangeFormat = key;
        };

        PlotTelemetryFormatter.prototype.formatDomainValue = function (value) {
            return this.telemetryFormatter
                .formatDomainValue(value, this.domainFormat);
        };

        PlotTelemetryFormatter.prototype.formatRangeValue = function (value) {
            if (typeof value === 'number') {
                return value.toFixed(DIGITS);
            }

            return this.telemetryFormatter
                .formatRangeValue(value, this.rangeFormat);
        };

        return PlotTelemetryFormatter;
    }
);
