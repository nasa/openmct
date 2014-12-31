/*global define*/

/**
 * Module defining TelemetryProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A telemetry aggregator makes many telemetry providers
         * appear as one.
         *
         * @constructor
         */
        function TelemetryAggregator($q, telemetryProviders) {

            // Merge the results from many providers into one
            // result object.
            function mergeResults(results) {
                var merged = {};

                results.forEach(function (result) {
                    Object.keys(result).forEach(function (k) {
                        merged[k] = result[k];
                    });
                });

                return merged;
            }

            // Request telemetry from all providers; once they've
            // responded, merge the results into one result object.
            function requestTelemetry(requests) {
                return $q.all(telemetryProviders.map(function (provider) {
                    return provider.requestTelemetry(requests);
                })).then(mergeResults);
            }

            // Subscribe to updates from all providers
            function subscribe(callback, requests) {
                var unsubscribes = telemetryProviders.map(function (provider) {
                    return provider.subscribe(callback, requests);
                });

                // Return an unsubscribe function that invokes unsubscribe
                // for all providers.
                return function () {
                    unsubscribes.forEach(function (unsubscribe) {
                        if (unsubscribe) {
                            unsubscribe();
                        }
                    });
                };
            }

            return {
                /**
                 * Request telemetry data.
                 * @param {TelemetryRequest[]} requests and array of
                 *        requests to be handled
                 * @returns {Promise} a promise for telemetry data
                 *          which may (or may not, depending on
                 *          availability) satisfy the requests
                 */
                requestTelemetry: requestTelemetry,
                /**
                 * Subscribe to streaming updates to telemetry data.
                 * The provided callback will be invoked as new
                 * telemetry becomes available; as an argument, it
                 * will receive an object of key-value pairs, where
                 * keys are source identifiers and values are objects
                 * of key-value pairs, where keys are point identifiers
                 * and values are TelemetrySeries objects containing
                 * the latest streaming telemetry.
                 * @param {Function} callback the callback to invoke
                 * @param {TelemetryRequest[]} requests an array of
                 *        requests to be subscribed upon
                 * @returns {Function} a function which can be called
                 *        to unsubscribe
                 */
                subscribe: subscribe
            };
        }

        return TelemetryAggregator;
    }
);