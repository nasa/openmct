/*global define*/
define(
    [],
    function () {
        'use strict';

        /**
         * Handle for changing x/y position of a line's end point.
         * This is used to support drag handles for line elements
         * in a fixed position view. Field names for opposite ends
         * are provided to avoid zero-length lines.
         * @constructor
         * @param element the line element
         * @param {string} xProperty field which stores x position
         * @param {string} yProperty field which stores x position
         * @param {string} xOther field which stores x of other end
         * @param {string} yOther field which stores y of other end
         */
        function LineHandle(element, xProperty, yProperty, xOther, yOther) {
            return {
                /**
                 * Get/set the x position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                x: function (value) {
                    if (arguments.length > 0) {
                        // Ensure we stay in view
                        value = Math.max(value, 0);
                        // Make sure end points will still be different
                        if (element[yOther] !== element[yProperty] ||
                                element[xOther] !== value) {
                            element[xProperty] = value;
                        }
                    }
                    return element[xProperty];
                },
                /**
                 * Get/set the y position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                y: function (value) {
                    if (arguments.length > 0) {
                        // Ensure we stay in view
                        value = Math.max(value, 0);
                        // Make sure end points will still be different
                        if (element[xOther] !== element[xProperty] ||
                                element[yOther] !== value) {
                            element[yProperty] = value;
                        }
                    }
                    return element[yProperty];
                }
            };
        }

        return LineHandle;

    }
);