/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        // Drag handle dimensions
        var DRAG_HANDLE_SIZE = [6, 6];

        /**
         * Template-displayable drag handle for an element in fixed
         * position mode.
         *
         * @param elementHandle the element handle
         * @param configPath the configuration path of an element
         * @param {Object} fixedControl the fixed controller
         * @memberof platform/features/layout
         * @constructor
         */
        function FixedDragHandle(elementHandle, configPath, fixedControl) {
            this.elementHandle = elementHandle;
            this.configPath = configPath;
            this.fixedControl = fixedControl;
        }

        /**
         * Get a CSS style to position this drag handle.
         *
         * @returns CSS style object (for `ng-style`)
         * @memberof platform/features/layout.FixedDragHandle#
         */
        FixedDragHandle.prototype.style = function () {
            var gridSize = this.elementHandle.getGridSize();

            // Adjust from grid to pixel coordinates
            var x = this.elementHandle.x() * gridSize[0],
                y = this.elementHandle.y() * gridSize[1];

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
        FixedDragHandle.prototype.startDrag = function () {
            // Cache initial x/y positions
            this.dragging = {
                x: this.elementHandle.x(),
                y: this.elementHandle.y()
            };
        };

        /**
         * Continue a drag gesture; update x/y positions.
         *
         * @param {number[]} delta x/y pixel difference since drag started
         */
        FixedDragHandle.prototype.continueDrag = function (delta) {
            var gridSize = this.elementHandle.getGridSize();

            if (this.dragging) {
                // Update x/y positions (snapping to grid)
                var newX = this.dragging.x + Math.round(delta[0] / gridSize[0]);
                var newY = this.dragging.y + Math.round(delta[1] / gridSize[1]);

                this.elementHandle.x(Math.max(0, newX));
                this.elementHandle.y(Math.max(0, newY));
                this.fixedControl.updateSelectionStyle();
            }
        };

        /**
         * End a drag gesture. This should be called when a drag
         * concludes to trigger commit of changes.
         */
        FixedDragHandle.prototype.endDrag = function () {
            this.dragging = undefined;
            this.fixedControl.mutate(this.configPath, this.elementHandle.element);
        };

        return FixedDragHandle;
    }
);
