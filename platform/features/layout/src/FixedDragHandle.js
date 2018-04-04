/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
         * @memberof platform/features/layout
         * @constructor
         */
        function FixedDragHandle(elementProxy, configPath, fixedControl) {
            this.elementProxy = elementProxy;
            this.configPath = configPath;
            this.gridSize = fixedControl.gridSize;
            this.fixedControl = fixedControl;
        }

        /**
         * Get a CSS style to position this drag handle.
         * @returns CSS style object (for `ng-style`)
         * @memberof platform/features/layout.FixedDragHandle#
         */
        FixedDragHandle.prototype.style = function () {
            var gridSize = this.elementProxy.getGridSize();

            // Adjust from grid to pixel coordinates
            var x = this.elementProxy.element.x * gridSize[0],
                y = this.elementProxy.element.y * gridSize[1];

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
                x: this.elementProxy.element.x,
                y: this.elementProxy.element.y
            };
        };

        /**
         * Continue a drag gesture; update x/y positions.
         * @param {number[]} delta x/y pixel difference since drag
         *                   started
         */
        FixedDragHandle.prototype.continueDrag = function (delta) {
            var gridSize = this.elementProxy.getGridSize();

            if (this.dragging) {
                // Update x/y positions (snapping to grid)
                var newX = this.dragging.x + Math.round(delta[0] / gridSize[0]);
                var newY = this.dragging.y + Math.round(delta[1] / gridSize[1]);
                this.elementProxy.element.x = Math.max(0, newX);
                this.elementProxy.element.y = Math.max(0, newY);
                this.fixedControl.updateSelectionStyle();
            }
        };

        /**
         * End a drag gesture. This should be called when a drag
         * concludes to trigger commit of changes.
         */
        FixedDragHandle.prototype.endDrag = function () {
            this.dragging = undefined;
            this.fixedControl.mutate(this.configPath, this.elementProxy.element);
        };

        return FixedDragHandle;
    }
);
