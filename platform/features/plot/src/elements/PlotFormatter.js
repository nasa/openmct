/*global define,moment*/

define(
    ["../../lib/moment.min"],
    function () {
        "use strict";

        var DATE_FORMAT = "YYYY-DDD HH:mm:ss";

        function PlotFormatter() {
            function formatDomainValue(v) {
                return moment.utc(v).format(DATE_FORMAT);
            }

            function formatRangeValue(v) {
                return v.toFixed(1);
            }

            return {
                formatDomainValue: formatDomainValue,
                formatRangeValue: formatRangeValue
            };
        }

        return PlotFormatter;

    }
);