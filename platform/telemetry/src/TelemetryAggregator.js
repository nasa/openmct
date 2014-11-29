/*global define,Promise*/

/**
 * Module defining TelemetryProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function TelemetryAggregator($q, telemetryProviders) {

            function mergeResults(results) {
                var merged = {};

                results.forEach(function (result) {
                    Object.keys(result).forEach(function (k) {
                        // Otherwise, just take the result
                        merged[k] = result[k];
                    });
                });

                return merged;
            }

            function requestTelemetry(requests) {
                return $q.all(telemetryProviders.map(function (provider) {
                    return provider.requestTelemetry(requests);
                })).then(mergeResults);
            }

            return {
                requestTelemetry: requestTelemetry
            };
        }

        return TelemetryAggregator;
    }
);