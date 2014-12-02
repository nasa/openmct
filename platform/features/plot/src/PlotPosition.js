/*global define*/

define(
    [],
    function () {
        "use strict";

        function PlotPosition(x, y, width, height, panZoomStack) {
            var panZoom = panZoomStack.getPanZoom(),
                origin = panZoom.origin,
                dimensions = panZoom.dimensions,
                position;

            if (!dimensions || !origin) {
                position = [];
            } else {
                position = [ x / width, (height - y) / height ].map(function (v, i) {
                    return v * dimensions[i] + origin[i];
                });
            }

            return {
                getDomain: function () {
                    return position[0];
                },
                getRange: function () {
                    return position[1];
                },
                getPosition: function () {
                    return position;
                }
            };

        }

        return PlotPosition;
    }
);