/*global define*/

define(
    [],
    function () {
        "use strict";

        function PlotTickGenerator(panZoomStack, formatter) {

            function generateTicks(start, span, count, format) {
                var step = span / (count - 1),
                    result = [],
                    i;

                for (i = 0; i < count; i += 1) {
                    result.push({
                        label: format(i * step + start)
                    });
                }

                return result;
            }


            return {
                generateDomainTicks: function (count) {
                    var panZoom = panZoomStack.getPanZoom();
                    return generateTicks(
                        panZoom.origin[0],
                        panZoom.dimensions[0],
                        count,
                        formatter.formatDomainValue
                    );
                },
                generateRangeTicks: function (count) {
                    var panZoom = panZoomStack.getPanZoom();
                    return generateTicks(
                        panZoom.origin[1],
                        panZoom.dimensions[1],
                        count,
                        formatter.formatRangeValue
                    );
                }
            };

        }

        return PlotTickGenerator;
    }
);