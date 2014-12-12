/*global define*/

define(
    ['./PlotPanZoomStack'],
    function (PlotPanZoomStack) {
        "use strict";

        function PlotPanZoomStackGroup(count) {
            var stacks = [],
                decoratedStacks = [],
                i;

            function pushPanZoom(origin, dimensions, index) {
                stacks.forEach(function (stack, i) {
                    if (i === index) {
                        stack.pushPanZoom(origin, dimensions);
                    } else {
                        stack.pushPanZoom(
                            [ origin[0], stack.getOrigin()[1] ],
                            [ dimensions[0], stack.getDimensions()[1] ]
                        );
                    }
                });
            }


            function popPanZoom() {
                stacks.forEach(function (stack) {
                    stack.popPanZoom();
                });
            }

            function setBasePanZoom(origin, dimensions) {
                stacks.forEach(function (stack) {
                    stack.setBasePanZoom(origin, dimensions);
                });
            }

            function clearPanZoom() {
                stacks.forEach(function (stack) {
                    stack.popPanZoom();
                });
            }

            function decorateStack(stack, index) {
                var result = Object.create(stack);

                result.pushPanZoom = function (origin, dimensions) {
                    pushPanZoom(origin, dimensions, index);
                };
                result.setBasePanZoom = setBasePanZoom;
                result.popPanZoom = popPanZoom;
                result.clearPanZoom = clearPanZoom;

                return result;
            }

            for (i = 0; i < count; i += 1) {
                stacks.push(new PlotPanZoomStack([], []));
            }
            decoratedStacks = stacks.map(decorateStack);

            return {
                popPanZoom: popPanZoom,
                clearPanZoom: clearPanZoom,
                setBasePanZoom: setBasePanZoom,
                getDepth: function () {
                    return stacks.length > 0 ?
                            stacks[0].getDepth() : 0;
                },
                getPanZoomStack: function (index) {
                    return decoratedStacks[index];
                }
            };

        }

        return PlotPanZoomStackGroup;
    }
);