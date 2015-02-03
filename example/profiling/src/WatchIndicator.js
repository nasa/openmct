/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Updates a count of currently-active Angular watches.
         * @constructor
         * @param $interval Angular's $interval
         */
        function WatchIndicator($interval, $rootScope) {
            var watches = 0;

            function count(scope) {
                if (scope) {
                    watches += (scope.$$watchers || []).length;
                    count(scope.$$childHead);
                    count(scope.$$nextSibling);
                }
            }

            function update() {
                watches = 0;
                count($rootScope);
            }

            // Update state every second
            $interval(update, 1000);

            // Provide initial state, too
            update();

            return {
                /**
                 * Get the glyph (single character used as an icon)
                 * to display in this indicator. This will return ".",
                 * which should appear as a dataflow icon.
                 * @returns {string} the character of the database icon
                 */
                getGlyph: function () {
                    return "E";
                },
                /**
                 * Get the name of the CSS class to apply to the glyph.
                 * This is used to color the glyph to match its
                 * state (one of ok, caution or err)
                 * @returns {string} the CSS class to apply to this glyph
                 */
                getGlyphClass: function () {
                    return (watches > 2000) ? "caution" :
                            (watches < 1000) ? "ok" :
                                    undefined;
                },
                /**
                 * Get the text that should appear in the indicator.
                 * @returns {string} brief summary of connection status
                 */
                getText: function () {
                    return watches + " watches";
                },
                /**
                 * Get a longer-form description of the current connection
                 * space, suitable for display in a tooltip
                 * @returns {string} longer summary of connection status
                 */
                getDescription: function () {
                    return "";
                }
            };
        }

        return WatchIndicator;

    }
);