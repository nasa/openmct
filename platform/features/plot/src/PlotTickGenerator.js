/*global define*/

define(
    [],
    function () {
        "use strict";

        function PlotTickGenerator(preparer, formatter) {

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
                    return generateTicks(
                        preparer.getOrigin()[0] + preparer.getDomainOffset(),
                        preparer.getDimensions()[0],
                        count,
                        formatter.formatDomainValue
                    );
                },
                generateRangeTicks: function (count) {
                    return generateTicks(
                        preparer.getOrigin()[1],
                        preparer.getDimensions()[1],
                        count,
                        formatter.formatRangeValue
                    );
                }
            };

        }

        return PlotTickGenerator;
    }
);