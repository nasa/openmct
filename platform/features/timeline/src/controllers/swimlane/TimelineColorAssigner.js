/*global define*/
define(
    [],
    function () {
        "use strict";

        var COLOR_OPTIONS = [
                "#20b2aa",
                "#9acd32",
                "#ff8c00",
                "#d2b48c",
                "#40e0d0",
                "#4169ff",
                "#ffd700",
                "#6a5acd",
                "#ee82ee",
                "#cc9966",
                "#99cccc",
                "#66cc33",
                "#ffcc00",
                "#ff6633",
                "#cc66ff",
                "#ff0066",
                "#ffff00",
                "#800080",
                "#00868b",
                "#008a00",
                "#ff0000",
                "#0000ff",
                "#f5deb3",
                "#bc8f8f",
                "#4682b4",
                "#ffafaf",
                "#43cd80",
                "#cdc1c5",
                "#a0522d",
                "#6495ed"
            ],
            // Fall back to black, as "no more colors available"
            FALLBACK_COLOR = "#000000";

        /**
         * Responsible for choosing unique colors for the resource
         * graph listing of a timeline view. Supports TimelineController.
         * @constructor
         * @param colors an object to store color configuration into;
         *        typically, this should be a property from the view's
         *        configuration, but TimelineSwimlane manages this.
         */
        function TimelineColorAssigner(colors) {
            // Find an unused color
            function freeColor() {
                // Set of used colors
                var set = {}, found;

                // Build up a set of used colors
                Object.keys(colors).forEach(function (id) {
                    set[colors[id]] = true;
                });

                // Find an unused color
                COLOR_OPTIONS.forEach(function (c) {
                    found = (!set[c] && !found) ? c : found;
                });

                // Provide the color
                return found || FALLBACK_COLOR;
            }

            return {
                /**
                 * Get the current color assignment.
                 * @param {string} id the id to which the color is assigned
                 */
                get: function (id) {
                    return colors[id];
                },
                /**
                 * Assign a new color to this id. If no color is specified,
                 * an unused color will be chosen.
                 * @param {string} id the id to which the color is assigned
                 * @param {string} [color] the new color to assign
                 */
                assign: function (id, color) {
                    colors[id] = typeof color === 'string' ? color : freeColor();
                },
                /**
                 * Release the color assignment for this id. That id will
                 * no longer have a color associated with it, and its color
                 * will be free to use in subsequent calls.
                 * @param {string} id the id whose color should be released
                 */
                release: function (id) {
                    delete colors[id];
                }
            };
        }

        return TimelineColorAssigner;
    }
);