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
 * Module defining SinewaveTelemetryProvider.
 * Created by vwoeltje on 11/12/14.
 *
 * @memberof example/generator
 */
define(
    ["./SinewaveTelemetrySeries"],
    function (SinewaveTelemetrySeries) {
        "use strict";

        /**
         * A telemetry provider that generates sine wave data for testing
         * and telemetry purposes.
         * @constructor
         */
        function SinewaveTelemetryProvider($q, $timeout) {
            this.$q = $q;
            this.$timeout = $timeout;
            this.subscriptions = [];
            this.generating = false;
        }

        SinewaveTelemetryProvider.prototype.doPackage = function (results) {
            var packaged = {};
            results.forEach(function (result) {
                packaged[result.key] = result.telemetry;
            });
            // Format as expected (sources -> keys -> telemetry)
            return { generator: packaged };
        };

        /**
         * Produce some data to be passed to registered subscription callbacks
         * @param request
         * @returns {{key: string, telemetry: SinewaveTelemetrySeries}}
         */
        SinewaveTelemetryProvider.prototype.generateData = function (request) {
            return {
                key: request.key,
                telemetry: new SinewaveTelemetrySeries(request)
            };
        };

        SinewaveTelemetryProvider.prototype.matchesSource = function (request) {
            return request.source === "generator";
        };

        /**
         * Invoke callbacks on all registered subscriptions when data is
         * available.
         */
        SinewaveTelemetryProvider.prototype.handleSubscriptions = function () {
            var self = this;
            self.subscriptions.forEach(function (subscription) {
                var requests = subscription.requests;
                subscription.callback(self.doPackage(
                    requests.filter(self.matchesSource).map(self.generateData)
                ));
            });
        };

        /**
         * Will start producing telemetry every second
         */
        SinewaveTelemetryProvider.prototype.startGenerating = function () {
            var self = this;
            self.generating = true;
            self.$timeout(function () {
                self.handleSubscriptions();
                if (self.generating && self.subscriptions.length > 0) {
                    self.startGenerating();
                } else {
                    self.generating = false;
                }
            }, 1000);
        };

        /**
         * Request historical telemetry from this source.
         * @param requests
         * @returns {object} an object with the request key as the key, and
         * a SinewaveTelemetrySeries as its value
         */
        SinewaveTelemetryProvider.prototype.requestTelemetry = function (requests) {
            var self = this;
            return this.$timeout(function () {
                return self.doPackage(requests.filter(self.matchesSource).map(self.generateData));
            }, 0);
        };

        /**
         * Subscribe to realtime telemetry
         * @param callback a function to call when data is available
         * @param requests all current telemetry requests (will be tested to
         * see if they match this source)
         * @returns {function} a function to call to unsubscribe from this
         * telemetry source
         */
        SinewaveTelemetryProvider.prototype.subscribe = function (callback, requests) {
            var self = this,
                subscription = {
                    callback: callback,
                    requests: requests
                };

            function unsubscribe() {
                self.subscriptions = self.subscriptions.filter(function (s) {
                    return s !== subscription;
                });
            }

            self.subscriptions.push(subscription);

            if (!this.generating) {
                this.startGenerating();
            }

            return unsubscribe;
        };

        return SinewaveTelemetryProvider;
    }
);
