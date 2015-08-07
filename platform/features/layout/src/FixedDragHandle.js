/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
         * @memberof platform/features/layout
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
                 * @memberof platform/features/layout.FixedDragHandle#
                 */
                style: getStyle,
                /**
                 * Start a drag gesture. This should be called when a drag
                 * begins to track initial state.
                 * @memberof platform/features/layout.FixedDragHandle#
                 */
                startDrag: startDrag,
                /**
                 * Continue a drag gesture; update x/y positions.
                 * @param {number[]} delta x/y pixel difference since drag
                 *                   started
                 * @memberof platform/features/layout.FixedDragHandle#
                 */
                continueDrag: continueDrag,
                /**
                 * End a drag gesture. This should be callled when a drag
                 * concludes to trigger commit of changes.
                 * @memberof platform/features/layout.FixedDragHandle#
                 */
                endDrag: endDrag
            };
        }

        return FixedDragHandle;
    }
);
