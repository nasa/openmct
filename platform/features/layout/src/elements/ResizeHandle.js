/*global define*/
define(
    [],
    function () {
        'use strict';

        /**
         * Handle for changing width/height properties of an element.
         * This is used to support drag handles for different
         * element types in a fixed position view.
         * @constructor
         */
        function ResizeHandle(element, minWidth, minHeight) {
            // Ensure reasonable defaults
            minWidth = minWidth || 0;
            minHeight = minHeight || 0;

            return {
                /**
                 * Get/set the x position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                x: function (value) {
                    if (arguments.length > 0) {
                        element.width = Math.max(
                            minWidth,
                            value - element.x
                        );
                    }
                    return element.x + element.width;
                },
                /**
                 * Get/set the y position of the lower-right corner
                 * of the handle-controlled element, changing size
                 * as necessary.
                 */
                y: function (value) {
                    if (arguments.length > 0) {
                        element.height = Math.max(
                            minHeight,
                            value - element.y
                        );
                    }
                    return element.y + element.height;
                }
            };
        }

        return ResizeHandle;

    }
);