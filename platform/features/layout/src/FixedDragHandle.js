/*global define*/

define(
    [],
    function () {
        'use strict';


        // Drag handle dimensions
        var DRAG_HANDLE_SIZE = [ 6, 6 ];

        /**
         * Template-displayable drag handle for an element in fixed
         * position mode.
         * @constructor
         */
        function FixedDragHandle(elementHandle, gridSize, update, commit) {
            var self = {},
                dragging;

            // Generate ng-style-appropriate style for positioning
            function getStyle() {
                // Adjust from grid to pixel coordinates
                var x = elementHandle.x() * gridSize[0],
                    y = elementHandle.y() * gridSize[1];

                // Convert to a CSS style centered on that point
                return {
                    left: (x - DRAG_HANDLE_SIZE[0] / 2) + 'px',
                    top: (y - DRAG_HANDLE_SIZE[1] / 2) + 'px',
                    width: DRAG_HANDLE_SIZE[0] + 'px',
                    height: DRAG_HANDLE_SIZE[1] + 'px'
                };
            }

            // Begin a drag gesture
            function startDrag() {
                // Cache initial x/y positions
                dragging = { x: elementHandle.x(), y: elementHandle.y() };
            }

            // Reposition during drag
            function continueDrag(delta) {
                if (dragging) {
                    // Update x/y positions (snapping to grid)
                    elementHandle.x(
                        dragging.x + Math.round(delta[0] / gridSize[0])
                    );
                    elementHandle.y(
                        dragging.y + Math.round(delta[1] / gridSize[1])
                    );
                    // Invoke update callback
                    if (update) {
                        update();
                    }
                }
            }

            // Conclude a drag gesture
            function endDrag() {
                // Clear cached state
                dragging = undefined;
                // Mark change as complete
                if (commit) {
                    commit("Dragged handle.");
                }
            }

            return {
                /**
                 * Get a CSS style to position this drag handle.
                 * @returns CSS style object (for `ng-style`)
                 */
                style: getStyle,
                /**
                 * Start a drag gesture. This should be called when a drag
                 * begins to track initial state.
                 */
                startDrag: startDrag,
                /**
                 * Continue a drag gesture; update x/y positions.
                 * @param {number[]} delta x/y pixel difference since drag
                 *                   started
                 */
                continueDrag: continueDrag,
                /**
                 * End a drag gesture. This should be callled when a drag
                 * concludes to trigger commit of changes.
                 */
                endDrag: endDrag
            };
        }

        return FixedDragHandle;
    }
);