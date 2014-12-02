/*global define*/

define(
    [],
    function () {
        "use strict";

        function PlotPanZoomStack(origin, dimensions) {
            var stack = [{ origin: origin, dimensions: dimensions }];

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
                getDepth: getDepth,
                pushPanZoom: pushPanZoom,
                popPanZoom: popPanZoom,
                setBasePanZoom: setBasePanZoom,
                clearPanZoom: clearPanZoom,
                getPanZoom: getPanZoom,
                getOrigin: getOrigin,
                getDimensions: getDimensions
            };
        }

        return PlotPanZoomStack;
    }
);