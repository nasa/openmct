/*global define*/

define(
    [],
    function () {
        'use strict';


        // 8 by 8 pixels
        var DRAG_HANDLE_SIZE = [ 8, 8 ];

        /**
         * Template-displayable drag handle for an element in fixed
         * position mode.
         * @constructor
         */
        function FixedDragHandle(elementHandle, gridSize, commit) {
            var self = {};

            function getStyle() {
                // Adjust from grid to pixel coordinates
                var x = elementHandle.x() * gridSize[0],
                    y = elementHandle.y() * gridSize[1];

                // Convert to a CSS style centered on that point
                return {
                    left: (x - DRAG_HANDLE_SIZE[0] / 2) + 'px',
                    right: (x - DRAG_HANDLE_SIZE[1] / 2) + 'px',
                    width: DRAG_HANDLE_SIZE[0] + 'px',
                    height: DRAG_HANDLE_SIZE[1] + 'px'
                };
            }

            function noop() {

            }

            return {
                /**
                 * Get a CSS style to position this drag handle.
                 * @returns CSS style object (for `ng-style`)
                 */
                style: getStyle,
                startDrag: noop,
                continueDrag: noop,
                endDrag: noop
            };
        }

        return FixedDragHandle;
    }
);