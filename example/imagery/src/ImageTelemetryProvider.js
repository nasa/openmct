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
 * Module defining ImageTelemetryProvider. Created by vwoeltje on 06/22/15.
 */
define(
    ["./ImageTelemetry"],
    function (ImageTelemetry) {
        "use strict";

        /**
         *
         * @constructor
         */
        function ImageTelemetryProvider($q, $timeout) {
            var subscriptions = [];

            //
            function matchesSource(request) {
                return request.source === "imagery";
            }

            // Used internally; this will be repacked by doPackage
            function generateData(request) {
                return {
                    key: request.key,
                    telemetry: new ImageTelemetry()
                };
            }

            //
            function doPackage(results) {
                var packaged = {};
                results.forEach(function (result) {
                    packaged[result.key] = result.telemetry;
                });
                // Format as expected (sources -> keys -> telemetry)
                return { imagery: packaged };
            }

            function requestTelemetry(requests) {
                return $timeout(function () {
                    return doPackage(requests.filter(matchesSource).map(generateData));
                }, 0);
            }

            function handleSubscriptions() {
                subscriptions.forEach(function (subscription) {
                    var requests = subscription.requests;
                    subscription.callback(doPackage(
                        requests.filter(matchesSource).map(generateData)
                    ));
                });
            }

            function startGenerating() {
                $timeout(function () {
                    handleSubscriptions();
                    if (subscriptions.length > 0) {
                        startGenerating();
                    }
                }, 1000);
            }

            function subscribe(callback, requests) {
                var subscription = {
                    callback: callback,
                    requests: requests
                };

                function unsubscribe() {
                    subscriptions = subscriptions.filter(function (s) {
                        return s !== subscription;
                    });
                }

                subscriptions.push(subscription);

                if (subscriptions.length === 1) {
                    startGenerating();
                }

                return unsubscribe;
            }

            return {
                requestTelemetry: requestTelemetry,
                subscribe: subscribe
            };
        }

        return ImageTelemetryProvider;
    }
);
