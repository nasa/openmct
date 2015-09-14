/*global define*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * Indicator that displays the current UTC time in the status area.
         * @implements Indicator
         */
        function ClockIndicator(tickerService, CLOCK_INDICATOR_FORMAT) {
            var text = "";

            tickerService.listen(function (timestamp) {
                text = moment.utc(timestamp).format(CLOCK_INDICATOR_FORMAT) + " UTC";
            });

            return {
                getGlyph: function () {
                    return "C";
                },
                getGlyphClass: function () {
                    return "";
                },
                getText: function () {
                    return text;
                },
                getDescription: function () {
                    return "";
                }
            };

        }

        return ClockIndicator;
    }
);
