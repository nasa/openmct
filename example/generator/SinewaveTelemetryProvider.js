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
/*global define,Promise*/

/**
 * Module defining SinewaveTelemetryProvider. Created by vwoeltje on 11/12/14.
 */
define([
    "./SinewaveTelemetrySeries",
    "./GeneratorProvider"
], function (
    SinewaveTelemetrySeries,
    GeneratorProvider
) {

    function SinewaveTelemetryProvider() {
        this.provider = new GeneratorProvider();
    }

    SinewaveTelemetryProvider.prototype.requestTelemetry = function (requests) {
        if (requests[0].source !== 'generator') {
            return Promise.resolve({});
        }
        return this.provider.request({}, requests[0])
            .then(function (data) {
                var res = {
                    generator: {}
                };
                res.generator[requests[0].key] = new SinewaveTelemetrySeries(data);
                return res;
            });
    };

    SinewaveTelemetryProvider.prototype.subscribe = function (callback, requests) {
        if (requests[0].source !== 'generator') {
            return function unsubscribe() {};
        }

        function wrapper(data) {
            var res = {
                generator: {}
            };
            res.generator[requests[0].key] = new SinewaveTelemetrySeries(data);
            callback(res);
        }

        return this.provider.subscribe({}, wrapper, requests[0]);
    };

    return SinewaveTelemetryProvider;
});
