/*global define*/

define(
    ["../TimelineFormatter"],
    function (TimelineFormatter) {
        "use strict";

        var FORMATTER = new TimelineFormatter();

        /**
         * Provides tabular data for the Timeline's tabular view area.
         */
        function TimelineTableController() {

            function getNiceTime(millis) {
                return FORMATTER.format(millis);
            }

            return {
                /**
                 * Return human-readable time in the expected format,
                 * currently SET.
                 * @param {number} millis duration, in millisecond
                 * @return {string} human-readable duration
                 */
                niceTime: getNiceTime
            };
        }

        return TimelineTableController;
    }
);
