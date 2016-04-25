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
    ["../../../example/generator/src/SinewaveTelemetryProvider"],
    function (SinewaveTelemetryProvider) {
        "use strict";

        var SOURCE = 'demo-telemetry';

        function DemoTelemetryProvider($q, $timeout) {
            SinewaveTelemetryProvider.call(this, $q, $timeout);
        }

        DemoTelemetryProvider.prototype = Object.create(SinewaveTelemetryProvider.prototype);

        DemoTelemetryProvider.prototype.doPackage = function (results) {
            var packaged = {};
            results.forEach(function (result) {
                packaged[result.key] = result.telemetry;
            });
            // Format as expected (sources -> keys -> telemetry)
            return { "demo-telemetry": packaged };
        }

        DemoTelemetryProvider.prototype.matchesSource = function (request) {
            return request.source === SOURCE;
        }

        DemoTelemetryProvider.prototype.subscribe = function (callback, requests) {
            var offsets = {};

            function wrapSeries(telemetrySeries, offset) {
                return {
                    getDomainValue: function (index, domain) {
                        return telemetrySeries.getDomainValue(index, domain);
                    },
                    getRangeValue: function (index, range) {
                        // Sine wave 'carrier' signal, with random phase shift
                        return telemetrySeries.getRangeValue(index, range)
                        // Introduce some random variability so that line is
                        // not straight or perfectly curved
                            + Math.random(1)/50
                        //Add a random range offset so that lines
                        // are not all bunched together
                            + offset;
                    },
                    getPointCount: function () {
                        return telemetrySeries.getPointCount();
                    }
                }
            }

            function randomize(telemetry){
                Object.keys(telemetry[SOURCE]).forEach(function(key) {
                    if (!offsets[key])
                        offsets[key] = 1 + Math.random(10);
                    telemetry[SOURCE][key] = wrapSeries(telemetry[SOURCE][key], offsets[key]);
                });
                callback(telemetry);
            }

            return SinewaveTelemetryProvider.prototype.subscribe.call(this, randomize, requests);
        };

        return DemoTelemetryProvider;
    }
);