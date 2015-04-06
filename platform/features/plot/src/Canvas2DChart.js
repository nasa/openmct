/*global define,Float32Array*/

define(
    [],
    function () {
        "use strict";

        /**
         * Create a new chart which uses Canvas's 2D API for rendering.
         *
         * @constructor
         * @param {CanvasElement} canvas the canvas object to render upon
         * @throws {Error} an error is thrown if WebGL is unavailable.
         */
        function Canvas2DChart(canvas) {
            return {
                /**
                 * Clear the chart.
                 */
                clear: function () {
                },
                /**
                 * Set the logical boundaries of the chart.
                 * @param {number[]} dimensions the horizontal and
                 *        vertical dimensions of the chart
                 * @param {number[]} origin the horizontal/vertical
                 *        origin of the chart
                 */
                setDimensions: function (dimensions, origin) {
                },
                /**
                 * Draw the supplied buffer as a line strip (a sequence
                 * of line segments), in the chosen color.
                 * @param {Float32Array} buf the line strip to draw,
                 *        in alternating x/y positions
                 * @param {number[]} color the color to use when drawing
                 *        the line, as an RGBA color where each element
                 *        is in the range of 0.0-1.0
                 * @param {number} points the number of points to draw
                 */
                drawLine: function (buf, color, points) {
                },
                /**
                 * Draw a rectangle extending from one corner to another,
                 * in the chosen color.
                 * @param {number[]} min the first corner of the rectangle
                 * @param {number[]} max the opposite corner
                 * @param {number[]} color the color to use when drawing
                 *        the rectangle, as an RGBA color where each element
                 *        is in the range of 0.0-1.0
                 */
                drawSquare: function (min, max, color) {
                }
            };
        }

        return Canvas2DChart;
    }
);