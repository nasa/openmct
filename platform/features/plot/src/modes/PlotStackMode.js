/*global define*/

define(
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStackGroup"],
    function (SubPlot, PlotPalette, PlotPanZoomStackGroup) {
        "use strict";

        /**
         * Handles plotting in Stacked mode. In stacked mode, there
         * is one sub-plot for each plotted object.
         * @constructor
         * @param {DomainObject[]} the domain objects to be plotted
         */
        function PlotStackMode(telemetryObjects, subPlotFactory) {
            var domainOffset,
                panZoomStackGroup =
                    new PlotPanZoomStackGroup(telemetryObjects.length),
                subplots = telemetryObjects.map(function (telemetryObject, i) {
                    return subPlotFactory.createSubPlot(
                        [telemetryObject],
                        panZoomStackGroup.getPanZoomStack(i)
                    );
                });

            function plotTelemetryTo(subplot, prepared, index) {
                var buffer = prepared.getBuffers()[index];

                // Track the domain offset, used to bias domain values
                // to minimize loss of precision when converted to 32-bit
                // floating point values for display.
                subplot.setDomainOffset(prepared.getDomainOffset());

                // Draw the buffers. Always use the 0th color, because there
                // is one line per plot.
                subplot.getDrawingObject().lines = [{
                    buffer: buffer,
                    color: PlotPalette.getFloatColor(0),
                    points: buffer.length / 2
                }];

                subplot.update();
            }

            function plotTelemetry(prepared) {
                // Fit to the boundaries of the data, but don't
                // override any user-initiated pan-zoom changes.
                panZoomStackGroup.setBasePanZoom(
                    prepared.getOrigin(),
                    prepared.getDimensions()
                );

                subplots.forEach(function (subplot, index) {
                    plotTelemetryTo(subplot, prepared, index);
                });
            }

            return {
                /**
                 * Plot telemetry to the sub-plot(s) managed by this mode.
                 * @param {PlotPreparer} prepared the prepared data to plot
                 */
                plotTelemetry: plotTelemetry,
                /**
                 * Get all sub-plots to be displayed in this mode; used
                 * to populate the plot template.
                 * @return {SubPlot[]} all sub-plots to display in this mode
                 */
                getSubPlots: function () {
                    return subplots;
                },
                /**
                 * Check if we are not in our base pan-zoom state (that is,
                 * there are some temporary user modifications to the
                 * current pan-zoom state.)
                 * @returns {boolean} true if not in the base pan-zoom state
                 */
                isZoomed: function () {
                    return panZoomStackGroup.getDepth() > 1;
                },
                /**
                 * Undo the most recent pan/zoom change and restore
                 * the prior state.
                 */
                stepBackPanZoom: function () {
                    panZoomStackGroup.popPanZoom();
                    subplots.forEach(function (subplot) {
                        subplot.update();
                    });
                },
                /**
                 * Undo all pan/zoom changes and restore the initial state.
                 */
                unzoom: function () {
                    panZoomStackGroup.clearPanZoom();
                    subplots.forEach(function (subplot) {
                        subplot.update();
                    });
                }
            };
        }

        return PlotStackMode;
    }
);