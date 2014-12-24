/*global define,moment*/

define(
    ['../lib/moment.min.js'],
    function () {
        "use strict";

        function TelemetryFormatter() {

            function formatDomainValue(key, value) {

            }

            function formatRangeValue(key, value) {

            }

            return {
                formatDomainValue: formatDomainValue,
                formatRangeValue: formatRangeValue
            };
        }

        return TelemetryFormatter;
    }
);