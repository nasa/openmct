/*global define,Promise*/

/**
 * Module defining SinewaveTelemetry. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        var firstObservedTime = Date.now();

        /**
         *
         * @constructor
         */
        function SinewaveTelemetry(request) {
            var latestObservedTime = Date.now(),
                count = Math.floor((latestObservedTime - firstObservedTime) / 1000),
                period = request.period || 30,
                generatorData = {};

            generatorData.getPointCount = function () {
                return count;
            };

            generatorData.getDomainValue = function (i, domain) {
                return i * 1000 +
                        (domain !== 'delta' ? firstObservedTime : 0);
            };

            generatorData.getRangeValue = function (i, range) {
                range = range || "sin";
                return Math[range](i * Math.PI * 2 / period);
            };

            return generatorData;
        }

        return SinewaveTelemetry;
    }
);