/*global define,moment*/

define(
    ['../lib/moment.min.js'],
    function () {
        "use strict";

        // Date format to use for domain values; in particular,
        // use day-of-year instead of month/day
        var DATE_FORMAT = "YYYY-DDD HH:mm:ss",
            VALUE_FORMAT_DIGITS = 3;

        /**
         * The TelemetryFormatter is responsible for formatting (as text
         * for display) values along either the domain (usually time) or
         * the range (usually value) of a data series.
         * @constructor
         */
        function TelemetryFormatter() {
            function formatDomainValue(v, key) {
                return isNaN(v) ? "" : moment.utc(v).format(DATE_FORMAT);
            }

            function formatRangeValue(v, key) {
                return isNaN(v) ? "" : v.toFixed(3);
            }

            return {
                /**
                 * Format a domain value.
                 * @param {number} v the domain value; a timestamp
                 *        in milliseconds since start of 1970
                 * @param {string} [key] the key which identifies the
                 *        domain; if unspecified or unknown, this will
                 *        be treated as a standard timestamp.
                 * @returns {string} a textual representation of the
                 *        data and time, suitable for display.
                 */
                formatDomainValue: formatDomainValue,
                /**
                 * Format a range value.
                 * @param {number} v the range value; a numeric value
                 * @param {string} [key] the key which identifies the
                 *        range; if unspecified or unknown, this will
                 *        be treated as a numeric value.
                 * @returns {string} a textual representation of the
                 *        value, suitable for display.
                 */
                formatRangeValue: formatRangeValue
            };
        }

        return TelemetryFormatter;
    }
);