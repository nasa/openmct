/*global define*/

define(
    [],
    function () {
        'use strict';

        // Conversion factors from time units to milliseconds
        var SECONDS = 1000,
            MINUTES = SECONDS * 60,
            HOURS = MINUTES * 60,
            DAYS = HOURS * 24;

        /**
         * Formatters for durations shown in a timeline view.
         * @constructor
         */
        function TimelineFormatter() {

            // Format a numeric value to a string with some number of digits
            function formatValue(value, digits) {
                var v = value.toString(10);
                // Pad with zeroes
                while (v.length < digits) {
                    v = "0" + v;
                }
                return v;
            }

            // Format duration to string
            function formatDuration(duration) {
                var days = Math.floor(duration / DAYS),
                    hours = Math.floor(duration / HOURS) % 24,
                    minutes = Math.floor(duration / MINUTES) % 60,
                    seconds = Math.floor(duration / SECONDS) % 60,
                    millis = Math.floor(duration) % 1000;

                return formatValue(days, 3) + " " +
                    formatValue(hours, 2) + ":" +
                    formatValue(minutes, 2) + ":" +
                    formatValue(seconds, 2) + "." +
                    formatValue(millis, 3);
            }

            return {
                /**
                 * Format the provided duration.
                 * @param {number} duration duration, in milliseconds
                 * @returns {string} displayable representation of duration
                 */
                format: formatDuration
            };
        }

        return TimelineFormatter;
    }
);