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
            this.elementHandle = elementHandle;
            this.gridSize = gridSize;
            this.update = update;
            this.commit = commit;
        }

        /**
         * Get a CSS style to position this drag handle.
         * @returns CSS style object (for `ng-style`)
         * @memberof platform/features/layout.FixedDragHandle#
         */
        FixedDragHandle.prototype.style = function () {
            // Adjust from grid to pixel coordinates
            var x = this.elementHandle.x() * this.gridSize[0],
                y = this.elementHandle.y() * this.gridSize[1];

            // Convert to a CSS style centered on that point
            return {
                left: (x - DRAG_HANDLE_SIZE[0] / 2) + 'px',
                top: (y - DRAG_HANDLE_SIZE[1] / 2) + 'px',
                width: DRAG_HANDLE_SIZE[0] + 'px',
                height: DRAG_HANDLE_SIZE[1] + 'px'
            };
        };

        /**
         * Start a drag gesture. This should be called when a drag
         * begins to track initial state.
         */
        FixedDragHandle.prototype.startDrag = function startDrag() {
            // Cache initial x/y positions
            this.dragging = {
                x: this.elementHandle.x(),
                y: this.elementHandle.y()
            };
        };

        /**
         * Continue a drag gesture; update x/y positions.
         * @param {number[]} delta x/y pixel difference since drag
         *                   started
         */
        FixedDragHandle.prototype.continueDrag = function (delta) {
            if (this.dragging) {
                // Update x/y positions (snapping to grid)
                this.elementHandle.x(
                    this.dragging.x + Math.round(delta[0] / this.gridSize[0])
                );
                this.elementHandle.y(
                    this.dragging.y + Math.round(delta[1] / this.gridSize[1])
                );
                // Invoke update callback
                if (this.update) {
                    this.update();
                }
            }
        };

        /**
         * End a drag gesture. This should be callled when a drag
         * concludes to trigger commit of changes.
         */
        FixedDragHandle.prototype.endDrag = function () {
            // Clear cached state
            this.dragging = undefined;
            // Mark change as complete
            if (this.commit) {
                this.commit("Dragged handle.");
            }
        };

        return FixedDragHandle;
    }
);
