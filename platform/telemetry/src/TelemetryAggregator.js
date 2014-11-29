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

            return {
                /**
                 * Request telemetry data.
                 * @param {TelemetryRequest[]} requests and array of
                 *        requests to be handled
                 * @returns {Promise} a promise for telemetry data
                 *          which may (or may not, depending on
                 *          availability) satisfy the requests
                 */
                requestTelemetry: requestTelemetry
            };
        }

        return TelemetryAggregator;
    }
);