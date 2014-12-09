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
         * @constructor
         * @param {number[]} origin the plot's origin, initially
         * @param {number[]} dimensions the plot's dimensions, initially
         */
        function PlotPanZoomStack(origin, dimensions) {
            // Use constructor parameters as the stack's initial state
            var stack = [{ origin: origin, dimensions: dimensions }];

            // Various functions which follow are simply wrappers for
            // normal stack-like array methods, with the exception that
            // they prevent undesired modification and enforce that this
            // stack must remain non-empty.
            // See JSDoc for specific methods below for more detail.
            function getDepth() {
                return stack.length;
            }

            function pushPanZoom(origin, dimensions) {
                stack.push({ origin: origin, dimensions: dimensions });
            }

            function popPanZoom() {
                if (stack.length > 1) {
                    stack.pop();
                }
            }

            function clearPanZoom() {
                stack = [stack[0]];
            }

            function setBasePanZoom(origin, dimensions) {
                stack[0] = { origin: origin, dimensions: dimensions };
            }

            function getPanZoom() {
                return stack[stack.length - 1];
            }

            function getOrigin() {
                return getPanZoom().origin;
            }

            function getDimensions() {
                return getPanZoom().dimensions;
            }

            return {
                /**
                 * Get the current stack depth; that is, the number
                 * of items on the stack. A depth of one means that no
                 * panning or zooming relative to the base value has
                 * been applied.
                 * @returns {number} the depth of the stack
                 */
                getDepth: getDepth,

                /**
                 * Push a new pan-zoom state onto the stack; this will
                 * become the active pan-zoom state.
                 * @param {number[]} origin the new origin
                 * @param {number[]} dimensions the new dimensions
                 */
                pushPanZoom: pushPanZoom,

                /**
                 * Pop a pan-zoom state from the stack. Whatever pan-zoom
                 * state was previously present will become current.
                 * If called when there is only one pan-zoom state on the
                 * stack, this acts as a no-op (that is, the lowest
                 * pan-zoom state on the stack cannot be popped, to ensure
                 * that some pan-zoom state is always available.)
                 */
                popPanZoom: popPanZoom,

                /**
                 * Set the base pan-zoom state; that is, the state at the
                 * bottom of the stack. This allows the "unzoomed" state of
                 * a plot to be updated (e.g. as new data comes in) without
                 * interfering with the user's chosen zoom level.
                 * @param {number[]} origin the base origin
                 * @param {number[]} dimensions the base dimensions
                 */
                setBasePanZoom: setBasePanZoom,

                /**
                 * Clear the pan-zoom stack down to its bottom element;
                 * in effect, pop all elements but the last, e.g. to remove
                 * any temporary user modifications to pan-zoom state.
                 */
                clearPanZoom: clearPanZoom,

                /**
                 * Get the current pan-zoom state (the state at the top
                 * of the stack), expressed as an object with "origin" and
                 * "dimensions" fields.
                 * @returns {object} the current pan-zoom state
                 */
                getPanZoom: getPanZoom,

                /**
                 * Get the current origin, as represented on the top of the
                 * stack.
                 * @returns {number[]} the current plot origin
                 */
                getOrigin: getOrigin,

                /**
                 * Get the current dimensions, as represented on the top of
                 * the stack.
                 * @returns {number[]} the current plot dimensions
                 */
                getDimensions: getDimensions
            };
        }

        return PlotPanZoomStack;
    }
);