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

        var ONE_DAY = 1000 * 60 * 60 * 24,
            firstObservedTime = Math.floor(Date.now() / 1000);

        /**
         *
         * @constructor
         */
        function SinewaveTelemetrySeries(request) {
            var latestObservedTime = Math.floor(Date.now() / 1000),
                endTime = (request.end !== undefined) ?
                        Math.floor(request.end / 1000) : latestObservedTime,
                count =
                    Math.min(endTime, latestObservedTime) - firstObservedTime,
                period = request.period || 30,
                generatorData = {},
                offset = (request.start !== undefined) ?
                        Math.floor(request.start / 1000) - firstObservedTime :
                        0;

            if (request.size !== undefined) {
                offset = Math.max(offset, count - request.size);
            }

            generatorData.getPointCount = function () {
                return count - offset;
            };

            generatorData.getDomainValue = function (i, domain) {
                return (i + offset) * 1000 + firstObservedTime * 1000 -
                        (domain === 'yesterday' ? ONE_DAY : 0);
            };

            generatorData.getRangeValue = function (i, range) {
                range = range || "sin";
                return Math[range]((i + offset) * Math.PI * 2 / period);
            };

            return generatorData;
        }

        return SinewaveTelemetrySeries;
    }
);
