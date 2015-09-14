/*global define*/

define(
    ['moment', 'moment-duration-format'],
    function (moment) {
        "use strict";

        var SHORT_FORMAT = "HH:mm:ss",
            LONG_FORMAT = "d[D] HH:mm:ss";

        /**
         * Provides formatting functions for Timers.
         *
         * Display formats for timers are a little different from what
         * moment.js provides, so we have custom logic here. This specifically
         * supports `TimerController`.
         *
         * @constructor
         */
        function TimerFormatter() {

            // Round this timestamp down to the second boundary
            // (e.g. 1124ms goes down to 1000ms, -2400ms goes down to -3000ms)
            function toWholeSeconds(duration) {
                return Math.abs(Math.floor(duration / 1000) * 1000);
            }

            // Short-form format, e.g. 02:22:11
            function short(duration) {
                return moment.duration(toWholeSeconds(duration), 'ms')
                    .format(SHORT_FORMAT, { trim: false });
            }

            // Long-form format, e.g. 3d 02:22:11
            function long(duration) {
                return moment.duration(toWholeSeconds(duration), 'ms')
                    .format(LONG_FORMAT, { trim: false });
            }

            return {
                /**
                 * Format a duration for display, using the short form.
                 * (e.g. 03:33:11)
                 * @param {number} duration the duration, in milliseconds
                 * @param {boolean} sign true if positive
                 */
                short: short,
                /**
                 * Format a duration for display, using the long form.
                 * (e.g. 0d 03:33:11)
                 * @param {number} duration the duration, in milliseconds
                 * @param {boolean} sign true if positive
                 */
                long: long
            };
        }

        return TimerFormatter;
    }
);
