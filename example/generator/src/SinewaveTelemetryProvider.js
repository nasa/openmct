/*global define,Promise*/

/**
 * Module defining SinewaveTelemetryProvider. Created by vwoeltje on 11/12/14.
 */
define(
    ["./SinewaveTelemetry"],
    function (SinewaveTelemetry) {
        "use strict";

        /**
         *
         * @constructor
         */
        function SinewaveTelemetryProvider($q, $timeout) {
            var subscriptions = [];

            //
            function matchesSource(request) {
                return request.source === "generator";
            }

            // Used internally; this will be repacked by doPackage
            function generateData(request) {
                return {
                    key: request.key,
                    telemetry: new SinewaveTelemetry(request)
                };
            }

            //
            function doPackage(results) {
                var packaged = {};
                results.forEach(function (result) {
                    packaged[result.key] = result.telemetry;
                });
                // Format as expected (sources -> keys -> telemetry)
                return { generator: packaged };
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

        return SinewaveTelemetryProvider;
    }
);