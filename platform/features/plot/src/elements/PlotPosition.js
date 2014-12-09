/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * A PlotPosition converts from pixel coordinates to domain-range
         * coordinates, based on the current plot boundary as described on
         * the pan-zoom stack.
         *
         * These coordinates are not updated after construction; that is,
         * they represent the result of the conversion at the time the
         * PlotPosition was instantiated. Care should be taken when retaining
         * PlotPosition objects across changes to the pan-zoom stack.
         *
         * @constructor
         * @param {number} x the horizontal pixel position in the plot area
         * @param {number} y the vertical pixel position in the plot area
         * @param {number} width the width of the plot area
         * @param {number} height the height of the plot area
         * @param {PanZoomStack} panZoomStack the applicable pan-zoom stack,
         *        used to determine the plot's domain-range boundaries.
         */
        function PlotPosition(x, y, width, height, panZoomStack) {
            var panZoom = panZoomStack.getPanZoom(),
                origin = panZoom.origin,
                dimensions = panZoom.dimensions,
                position;

            function convert(v, i) {
                return v * dimensions[i] + origin[i];
            }

            if (!dimensions || !origin) {
                // We need both dimensions and origin to compute a position
                position = [];
            } else {
                // Convert from pixel to domain-range space.
                // Note that range is reversed from the y-axis in pixel space
                //(positive range points up, positive pixel-y points down)
                position = [ x / width, (height - y) / height ].map(convert);
            }

            return {
                /**
                 * Get the domain value corresponding to this pixel position.
                 * @returns {number} the domain value
                 */
                getDomain: function () {
                    return position[0];
                },
                /**
                 * Get the range value corresponding to this pixel position.
                 * @returns {number} the range value
                 */
                getRange: function () {
                    return position[1];
                },
                /**
                 * Get the domain and values corresponding to this
                 * pixel position.
                 * @returns {number[]} an array containing the domain and
                 *          the range value, in that order
                 */
                getPosition: function () {
                    return position;
                }
            };

        }

        return PlotPosition;
    }
);