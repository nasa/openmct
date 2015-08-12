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
        "use strict";

        /**
         * The PlotPanZoomStack is responsible for maintaining the
         * pan-zoom state of a plot (expressed as a boundary starting
         * at an origin and extending to certain dimensions) in a
         * stack, to support the back and unzoom buttons in plot controls.
         *
         * Dimensions and origins are here described each by two-element
         * arrays, where the first element describes a value or quantity
         * along the domain axis, and the second element describes the same
         * along the range axis.
         *
         * @memberof platform/features/plot
         * @constructor
         * @param {number[]} origin the plot's origin, initially
         * @param {number[]} dimensions the plot's dimensions, initially
         */
        function PlotPanZoomStack(origin, dimensions) {
            // Use constructor parameters as the stack's initial state
            this.stack = [{ origin: origin, dimensions: dimensions }];
        }

        // Various functions which follow are simply wrappers for
        // normal stack-like array methods, with the exception that
        // they prevent undesired modification and enforce that this
        // stack must remain non-empty.
        // See JSDoc for specific methods below for more detail.

        /**
         * Get the current stack depth; that is, the number
         * of items on the stack. A depth of one means that no
         * panning or zooming relative to the base value has
         * been applied.
         * @returns {number} the depth of the stack
         */
        PlotPanZoomStack.prototype.getDepth = function getDepth() {
            return this.stack.length;
        };

        /**
         * Push a new pan-zoom state onto the stack; this will
         * become the active pan-zoom state.
         * @param {number[]} origin the new origin
         * @param {number[]} dimensions the new dimensions
         */
        PlotPanZoomStack.prototype.pushPanZoom = function (origin, dimensions) {
            this.stack.push({ origin: origin, dimensions: dimensions });
        };

        /**
         * Pop a pan-zoom state from the stack. Whatever pan-zoom
         * state was previously present will become current.
         * If called when there is only one pan-zoom state on the
         * stack, this acts as a no-op (that is, the lowest
         * pan-zoom state on the stack cannot be popped, to ensure
         * that some pan-zoom state is always available.)
         */
        PlotPanZoomStack.prototype.popPanZoom = function popPanZoom() {
            if (this.stack.length > 1) {
                this.stack.pop();
            }
        };

        /**
         * Set the base pan-zoom state; that is, the state at the
         * bottom of the stack. This allows the "unzoomed" state of
         * a plot to be updated (e.g. as new data comes in) without
         * interfering with the user's chosen zoom level.
         * @param {number[]} origin the base origin
         * @param {number[]} dimensions the base dimensions
         * @memberof platform/features/plot.PlotPanZoomStack#
         */
        PlotPanZoomStack.prototype.setBasePanZoom = function (origin, dimensions) {
            this.stack[0] = { origin: origin, dimensions: dimensions };
        };

        /**
         * Clear the pan-zoom stack down to its bottom element;
         * in effect, pop all elements but the last, e.g. to remove
         * any temporary user modifications to pan-zoom state.
         */
        PlotPanZoomStack.prototype.clearPanZoom = function clearPanZoom() {
            this.stack = [this.stack[0]];
        };

        /**
         * Get the current pan-zoom state (the state at the top
         * of the stack), expressed as an object with "origin" and
         * "dimensions" fields.
         * @returns {object} the current pan-zoom state
         */
        PlotPanZoomStack.prototype.getPanZoom = function getPanZoom() {
            return this.stack[this.stack.length - 1];
        };

        /**
         * Get the current origin, as represented on the top of the
         * stack.
         * @returns {number[]} the current plot origin
         */
        PlotPanZoomStack.prototype.getOrigin = function getOrigin() {
            return this.getPanZoom().origin;
        };

        /**
         * Get the current dimensions, as represented on the top of
         * the stack.
         * @returns {number[]} the current plot dimensions
         */
        PlotPanZoomStack.prototype.getDimensions = function getDimensions() {
            return this.getPanZoom().dimensions;
        };

        return PlotPanZoomStack;
    }
);
