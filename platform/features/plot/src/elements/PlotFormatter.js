/*global define,moment*/

define(
    ["../../lib/moment.min"],
    function () {
        "use strict";

        // Date format to use for domain values; in particular,
        // use day-of-year instead of month/day
        var DATE_FORMAT = "YYYY-DDD HH:mm:ss";

        /**
         * The PlotFormatter is responsible for formatting (as text
         * for display) values along either the domain or range of a
         * plot.
         */
        function PlotFormatter() {
            function formatDomainValue(v) {
                return moment.utc(v).format(DATE_FORMAT);
            }

            function formatRangeValue(v) {
                return v.toFixed(1);
            }

            return {
                /**
                 * Format a domain value.
                 * @param {number} v the domain value; a timestamp
                 *        in milliseconds since start of 1970
                 * @returns {string} a textual representation of the
                 *        data and time, suitable for display.
                 */
                formatDomainValue: formatDomainValue,
                /**
                 * Format a range value.
                 * @param {number} v the range value; a numeric value
                 * @returns {string} a textual representation of the
                 *        value, suitable for display.
                 */
                formatRangeValue: formatRangeValue
            };
        }

        return PlotFormatter;

    }
);