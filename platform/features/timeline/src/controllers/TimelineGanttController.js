/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Control for Gantt bars in a timeline view.
         * Primarily reesponsible for supporting the positioning of Gantt
         * bars; particularly, this ensures that the left and right edges
         * never go to far off screen, because in some environments this
         * will effect rendering performance without visible results.
         * @constructor
         * @param {number} MAXIMUM_OFFSCREEN the maximum number of pixels
         *        allowed to go off-screen (to either the left or the right)
         */
        function TimelineGanttController(MAXIMUM_OFFSCREEN) {
            // Pixel position for the CSS left property
            function left(timespan, scroll, toPixels) {
                return Math.max(
                    toPixels(timespan.getStart()),
                    scroll.x - MAXIMUM_OFFSCREEN
                );
            }

            // Pixel value for the CSS width property
            function width(timespan, scroll, toPixels) {
                var x = left(timespan, scroll, toPixels),
                    right = Math.min(
                        toPixels(timespan.getEnd()),
                        scroll.x + scroll.width + MAXIMUM_OFFSCREEN
                    );
                return right - x;
            }

            return {
                /**
                 * Get the pixel position for the `left` style property
                 * of a Gantt bar for the specified timespan.
                 * @param {Timespan} timespan the timespan to be represented
                 * @param scroll an object containing an `x` and `width`
                 *        property, representing the scroll position and
                 *        visible width, respectively.
                 * @param {Function} toPixels a function to convert
                 *        a timestamp to a pixel position
                 * @returns {number} the pixel position of the left edge
                 */
                left: left,
                /**
                 * Get the pixel value for the `width` style property
                 * of a Gantt bar for the specified timespan.
                 * @param {Timespan} timespan the timespan to be represented
                 * @param scroll an object containing an `x` and `width`
                 *        property, representing the scroll position and
                 *        visible width, respectively.
                 * @param {Function} toPixels a function to convert
                 *        a timestamp to a pixel position
                 * @returns {number} the pixel width of this Gantt bar
                 */
                width: width
            };
        }

        return TimelineGanttController;
    }
);