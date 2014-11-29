/*global define*/

/**
 * Module defining Telemetry. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function Telemetry(array, defaults) {
            // Assume array-of-arrays if not otherwise specified,
            // where first value is x, second is y
            defaults = defaults || {
                domain: 0,
                range: 1
            };

            return {
                getPointCount: function () {
                    return array.length;
                },
                getRangeValue: function (index, range) {
                    return array[index][range || defaults.range];
                },
                getDomainValue: function (index, domain) {
                    return array[index][domain || defaults.domain];
                }
            };
        }

        return Telemetry;
    }
);