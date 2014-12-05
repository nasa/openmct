/*global define*/

define(
    [],
    function () {
        "use strict";

        function LayoutDrag(rawPosition, posFactor, dimFactor, gridSize) {
            function toGridDelta(pixelDelta) {
                return pixelDelta.map(function (v, i) {
                    return Math.round(v / gridSize[i]);
                });
            }

            function multiply(array, factors) {
                return array.map(function (v, i) {
                    return v * factors[i];
                });
            }

            function add(array, other) {
                return array.map(function (v, i) {
                    return v + other[i];
                });
            }

            function max(array, other) {
                return array.map(function (v, i) {
                    return Math.max(v, other[i]);
                });
            }

            function getAdjustedPosition(pixelDelta) {
                var gridDelta = toGridDelta(pixelDelta);
                return {
                    position: max(add(
                        rawPosition.position,
                        multiply(gridDelta, posFactor)
                    ), [0, 0]),
                    dimensions: max(add(
                        rawPosition.dimensions,
                        multiply(gridDelta, dimFactor)
                    ), [1, 1])
                };

            }

            return {
                getAdjustedPosition: getAdjustedPosition
            };
        }

        return LayoutDrag;

    }
);