/*global define,Float32Array,Promise*/

/**
 * Module defining TelemetryHelper. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Helps to interpret the contents of Telemetry objects.
         * @constructor
         */
        function TelemetryHelper() {
            return {
                getBufferedForm: function (telemetry, start, end, domain, range) {
                    var arr = [],
                        domainMin = Number.MAX_VALUE,
                        rangeMin = Number.MAX_VALUE,
                        domainMax = Number.MIN_VALUE,
                        rangeMax = Number.MIN_VALUE,
                        domainValue,
                        rangeValue,
                        count,
                        i;

                    function trackBounds(domainValue, rangeValue) {
                        domainMin = Math.min(domainMin, domainValue);
                        domainMax = Math.max(domainMax, domainValue);
                        rangeMin = Math.min(rangeMin, rangeValue);
                        rangeMax = Math.max(rangeMax, rangeValue);
                    }

                    function applyOffset() {
                        var j;
                        for (j = 0; j < arr.length; j += 2) {
                            arr[j] -= domainMin;
                            arr[j + 1] -= rangeMin;
                        }
                    }

                    count = telemetry.getPointCount();

                    if (start === undefined) {
                        start = telemetry.getDomainValue(0, domain);
                    }

                    if (end === undefined) {
                        end = telemetry.getDomainValue(count - 1, domain);
                    }

                    for (i = 0; i < telemetry.getPointCount(); i += 1) {
                        // TODO: Binary search for start, end
                        domainValue = telemetry.getDomainValue(i, domain);

                        if (domainValue >= start && domainValue <= end) {
                            rangeValue = telemetry.getRangeValue(i, range);
                            arr.push(domainValue);
                            arr.push(rangeValue);
                            trackBounds(domainValue, rangeValue);
                        }
                    }

                    applyOffset();

                }
            };
        }

        return TelemetryHelper;
    }
);