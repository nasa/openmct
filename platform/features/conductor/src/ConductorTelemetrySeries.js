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
    function () {
        'use strict';


        /**
         * Bound a series of telemetry such that it only includes
         * points from within the time conductor's displayable window.
         *
         * @param {TelemetrySeries} series the telemetry series
         * @param {platform/features/conductor.TimeConductor} the
         *        time conductor instance which bounds this series
         * @constructor
         * @implements {TelemetrySeries}
         */
        function ConductorTelemetrySeries(series, conductor) {
            var max = series.getPointCount() - 1,
                domain = conductor.activeDomain();

            function binSearch(min, max, value) {
                var mid = Math.floor((min + max) / 2);

                return min > max ? min :
                        series.getDomainValue(mid, domain) < value ?
                                binSearch(mid + 1, max, value) :
                                        binSearch(min, mid - 1, value);
            }

            this.startIndex = binSearch(0, max, conductor.displayStart());
            this.endIndex = binSearch(0, max, conductor.displayEnd());
            this.series = series;
            this.domain = domain;
        }

        ConductorTelemetrySeries.prototype.getPointCount = function () {
            return Math.max(0, this.endIndex - this.startIndex);
        };

        ConductorTelemetrySeries.prototype.getDomainValue = function (i, d) {
            d = d || this.domain;
            return this.series.getDomainValue(i + this.startIndex, d);
        };

        ConductorTelemetrySeries.prototype.getRangeValue = function (i, r) {
            return this.series.getRangeValue(i + this.startIndex, r);
        };

        return ConductorTelemetrySeries;
    }
);
