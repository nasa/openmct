/*global define*/

define(
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStack"],
    function (SubPlot, PlotPalette, PlotPanZoomStack) {
        "use strict";

        function PlotOverlayMode(telemetryObjects) {
            var domainOffset,
                panZoomStack = new PlotPanZoomStack([], []),
                subplot = new SubPlot(telemetryObjects, panZoomStack),
                subplots = [ subplot ];

            function plotTelemetry(prepared) {
                 // Fit to the boundaries of the data, but don't
                // override any user-initiated pan-zoom changes.
                panZoomStack.setBasePanZoom(
                    prepared.getOrigin(),
                    prepared.getDimensions()
                );

                // Track the domain offset, used to bias domain values
                // to minimize loss of precision when converted to 32-bit
                // floating point values for display.
                domainOffset = prepared.getDomainOffset();

                // Draw the buffers. Select color by index.
                subplot.getDrawingObject().lines = prepared.getBuffers().map(function (buf, i) {
                    return {
                        buffer: buf,
                        color: PlotPalette.getFloatColor(i),
                        points: buf.length / 2
                    };
                });

                subplot.update();
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
                    subplot.update();
                },
                unzoom: function () {
                    panZoomStack.clearPanZoom();
                    subplot.update();
                }
            };
        }

        return PlotOverlayMode;
    }
);