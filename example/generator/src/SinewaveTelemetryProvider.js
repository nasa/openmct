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

            return {
                requestTelemetry: requestTelemetry
            };
        }

        return SinewaveTelemetryProvider;
    }
);