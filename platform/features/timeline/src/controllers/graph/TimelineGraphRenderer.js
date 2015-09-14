/*global define,Float32Array*/

define(
    [],
    function () {
        'use strict';

        /**
         * Responsible for preparing data for display by
         * `mct-chart` in a timeline's resource graph.
         * @constructor
         */
        function TimelineGraphRenderer() {
            return {
                /**
                 * Render a resource utilization to a Float32Array,
                 * to be passed to WebGL for display.
                 * @param {ResourceGraph} graph the resource utilization
                 * @returns {Float32Array} the rendered buffer
                 */
                render: function (graph) {
                    var count = graph.getPointCount(),
                        buffer = new Float32Array(count * 2),
                        i;

                    // Populate the buffer
                    for (i = 0; i < count; i += 1) {
                        buffer[i * 2] = graph.getDomainValue(i);
                        buffer[i * 2 + 1] = graph.getRangeValue(i);
                    }

                    return buffer;
                },
                /**
                 * Convert an HTML color (in #-prefixed 6-digit hexadecimal)
                 * to an array of floating point values in a range of 0.0-1.0.
                 * An alpha element is included to facilitate display in an
                 * `mct-chart` (which uses WebGL.)
                 * @param {string} the color
                 * @returns {number[]} the same color, in floating-point format
                 */
                decode: function (color) {
                    // Check for bad input, default to black if needed
                    color = /^#[A-Fa-f0-9]{6}$/.test(color) ? color : "#000000";

                    // Pull out R, G, B hex values
                    return [
                        color.substring(1, 3),
                        color.substring(3, 5),
                        color.substring(5, 7)
                    ].map(function (c) {
                        // Hex -> number
                        return parseInt(c, 16) / 255;
                    }).concat([1]); // Add the alpha channel
                }
            };
        }

        return TimelineGraphRenderer;

    }
);