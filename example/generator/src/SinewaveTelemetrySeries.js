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
/*global define,Promise*/

/**
 * Module defining SinewaveTelemetry. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        var firstObservedTime = Date.now();

        /**
         *
         * @constructor
         */
        function SinewaveTelemetrySeries(request) {
            var firstTime = (request || {}).start || firstObservedTime,
                latestObservedTime = Date.now(),
                count = Math.floor((latestObservedTime - firstTime) / 1000),
                period = request.period || 30,
                generatorData = {};

            generatorData.getPointCount = function () {
                return count;
            };

            generatorData.getDomainValue = function (i, domain) {
                return i * 1000 +
                        (domain !== 'delta' ? firstTime : 0);
            };

            generatorData.getRangeValue = function (i, range) {
                range = range || "sin";
                return Math[range](i * Math.PI * 2 / period);
            };

            return generatorData;
        }

        return SinewaveTelemetrySeries;
    }
);
