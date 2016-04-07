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

define(
    [""],
    function () {
        "use strict";

        var SOURCE = 'generator';

        //TODO: Redo as class extension.
        function DemoTelemetryProvider(telemetryProvider) {

            function requestTelemetry(requests) {
                return telemetryProvider.requestTelemetry(requests);
            }

            function wrapSeries(telemetrySeries) {
                return {
                    getDomainValue: function (index, domain) {
                        return telemetrySeries.getDomainValue(index, domain);
                    },
                    getRangeValue: function (index, range) {
                        return Math.random(1)/5 + telemetrySeries.getRangeValue(index, range);
                    },
                    getPointCount: function () {
                        return telemetrySeries.getPointCount();
                    }
                }
            }

            function subscribe(callback, requests) {
                function randomize(telemetry){
                    if (telemetry.generator) {
                        Object.keys(telemetry.generator).forEach(function(key) {
                           telemetry.generator[key] = wrapSeries(telemetry.generator[key]);
                        });
                    }
                    callback(telemetry);
                }
                return telemetryProvider.subscribe(randomize, requests);
            }

            return {
                requestTelemetry: requestTelemetry,
                subscribe: subscribe
            }
        }

        return DemoTelemetryProvider;
    }
);