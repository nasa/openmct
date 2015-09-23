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
    ['./PlotPanZoomStack'],
    function (PlotPanZoomStack) {
        "use strict";

        /**
         * A plot pan zoom stack group provides a collection of individual
         * pan-zoom stacks that synchronize upon the domain axis, but
         * remain independent upon the range axis. This supports panning
         * and zooming in stacked-plot mode (and, importantly,
         * stepping back through those states.)
         * @memberof platform/features/plot
         * @constructor
         * @param {number} count the number of stacks to include in this
         *        group
         */
        function PlotPanZoomStackGroup(count) {
            var self = this;

            // Push a pan-zoom state; the index argument identifies
            // which stack originated the request (all other stacks
            // will ignore the range part of the change.)
            function pushPanZoom(origin, dimensions, index) {
                self.stacks.forEach(function (stack, i) {
                    if (i === index) {
                        // Do a normal push for the specified stack
                        stack.pushPanZoom(origin, dimensions);
                    } else {
                        // For other stacks, do a push, but repeat
                        // their current range axis bounds.
                        stack.pushPanZoom(
                            [ origin[0], stack.getOrigin()[1] ],
                            [ dimensions[0], stack.getDimensions()[1] ]
                        );
                    }
                });
            }


            // Decorate a pan-zoom stack; returns an object with
            // the same interface, but whose stack-mutation methods
            // effect all items in the group.
            function decorateStack(stack, index) {
                var result = Object.create(stack);

                // Use the methods defined above
                result.pushPanZoom = function (origin, dimensions) {
                    pushPanZoom(origin, dimensions, index);
                };
                result.setBasePanZoom = function () {
                    self.setBasePanZoom.apply(self, arguments);
                };
                result.popPanZoom = function () {
                    self.popPanZoom.apply(self, arguments);
                };
                result.clearPanZoom = function () {
                    self.clearPanZoom.apply(self, arguments);
                };

                return result;
            }

            // Create the stacks in this group ...
            this.stacks = [];
            while (this.stacks.length < count) {
                this.stacks.push(new PlotPanZoomStack([], []));
            }
            // ... and their decorated-to-synchronize versions.
            this.decoratedStacks = this.stacks.map(decorateStack);
        }

        /**
         * Pop a pan-zoom state from all stacks in the group.
         * If called when there is only one pan-zoom state on each
         * stack, this acts as a no-op (that is, the lowest
         * pan-zoom state on the stack cannot be popped, to ensure
         * that some pan-zoom state is always available.)
         */
        PlotPanZoomStackGroup.prototype.popPanZoom = function () {
            this.stacks.forEach(function (stack) {
                stack.popPanZoom();
            });
        };

        /**
         * Set the base pan-zoom state for all stacks in this group.
         * This changes the state at the bottom of each stack.
         * This allows the "unzoomed" state of plots to be updated
         * (e.g. as new data comes in) without
         * interfering with the user's chosen pan/zoom states.
         * @param {number[]} origin the base origin
         * @param {number[]} dimensions the base dimensions
         */
        PlotPanZoomStackGroup.prototype.setBasePanZoom = function (origin, dimensions) {
            this.stacks.forEach(function (stack) {
                stack.setBasePanZoom(origin, dimensions);
            });
        };

        /**
         * Clear all pan-zoom stacks in this group down to
         * their bottom element; in effect, pop all elements
         * but the last, e.g. to remove any temporary user
         * modifications to pan-zoom state.
         */
        PlotPanZoomStackGroup.prototype.clearPanZoom = function () {
            this.stacks.forEach(function (stack) {
                stack.clearPanZoom();
            });
        };

        /**
         * Get the current stack depth; that is, the number
         * of items on each stack in the group.
         * A depth of one means that no
         * panning or zooming relative to the base value has
         * been applied.
         * @returns {number} the depth of the stacks in this group
         */
        PlotPanZoomStackGroup.prototype.getDepth = function () {
            // All stacks are kept in sync, so look up depth
            // from the first one.
            return this.stacks.length > 0 ? this.stacks[0].getDepth() : 0;
        };

        /**
         * Get a specific pan-zoom stack in this group.
         * Stacks are specified by index; this index must be less
         * than the count provided at construction time, and must
         * not be less than zero.
         * The stack returned by this function will be synchronized
         * to other stacks in this group; that is, mutating that
         * stack directly will result in other stacks in this group
         * undergoing similar updates to ensure that domain bounds
         * remain the same.
         * @param {number} index the index of the stack to get
         * @returns {PlotPanZoomStack} the pan-zoom stack in the
         *          group identified by that index
         */
        PlotPanZoomStackGroup.prototype.getPanZoomStack = function (index) {
            return this.decoratedStacks[index];
        };

        return PlotPanZoomStackGroup;
    }
);
