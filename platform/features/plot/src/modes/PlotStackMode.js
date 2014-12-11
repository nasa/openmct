/*global define*/

define(
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStack"],
    function (SubPlot, PlotPalette, PlotPanZoomStack) {
        "use strict";

        function PlotStackMode(telemetryObjects) {
            var domainOffset,
                panZoomStack = new PlotPanZoomStack([], []),
                subplots = telemetryObjects.map(function (telemetryObject) {
                    return new SubPlot([telemetryObject], panZoomStack);
                });

            function plotTelemetryTo(subplot, prepared, index) {
                var buffer = prepared.getBuffers()[index];

                // Track the domain offset, used to bias domain values
                // to minimize loss of precision when converted to 32-bit
                // floating point values for display.
                subplot.setDomainOffset(prepared.getDomainOffset());

                // Draw the buffers. Always use the 0th color
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
                panZoomStack.setBasePanZoom(
                    prepared.getOrigin(),
                    prepared.getDimensions()
                );

                subplots.forEach(function (subplot, index) {
                    plotTelemetryTo(subplot, prepared, index);
                });
            }

            return {
                plotTelemetry: plotTelemetry,
                getSubPlots: function () {
                    return subplots;
                },
                isZoomed: function () {
                    return panZoomStack.getDepth() > 1;
                },
                stepBackPanZoom: function () {
                    panZoomStack.pop();
                    subplots.forEach(function (subplot) {
                        subplot.update();
                    });
                },
                unzoom: function () {
                    panZoomStack.clearPanZoom();
                    subplots.forEach(function (subplot) {
                        subplot.update();
                    });
                }
            };
        }

        return PlotStackMode;
    }
);