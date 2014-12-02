/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The PlotTickGenerator provides labels for ticks along the
         * domain and range axes of the plot, to support the plot
         * template.
         *
         * @constructor
         * @param {PlotPanZoomStack} panZoomStack the pan-zoom stack for
         *        this plot, used to determine plot boundaries
         * @param {PlotFormatter} formatter used to format (for display)
         *        domain and range values.
         */
        function PlotTickGenerator(panZoomStack, formatter) {

            // Generate ticks; interpolate from start up to
            // start + span in count steps, using the provided
            // formatter to represent each value.
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
                /**
                 * Generate tick marks for the domain axis.
                 * @param {number} count the number of ticks
                 * @returns {string[]} labels for those ticks
                 */
                generateDomainTicks: function (count) {
                    var panZoom = panZoomStack.getPanZoom();
                    return generateTicks(
                        panZoom.origin[0],
                        panZoom.dimensions[0],
                        count,
                        formatter.formatDomainValue
                    );
                },

                /**
                 * Generate tick marks for the range axis.
                 * @param {number} count the number of ticks
                 * @returns {string[]} labels for those ticks
                 */
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