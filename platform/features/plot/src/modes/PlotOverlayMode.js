/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStack"],
    function (SubPlot, PlotPalette, PlotPanZoomStack) {
        "use strict";

        /**
         * Handles plotting in Overlaid mode. In overlaid mode, there
         * is one sub-plot which contains all plotted objects.
         * @memberof platform/features/plot
         * @constructor
         * @implements {platform/features/plot.PlotModeHandler}
         * @param {DomainObject[]} the domain objects to be plotted
         */
        function PlotOverlayMode(telemetryObjects, subPlotFactory) {
            this.panZoomStack = new PlotPanZoomStack([], []);
            this.subplot = subPlotFactory.createSubPlot(
                telemetryObjects,
                this.panZoomStack
            );
            this.subplots = [ this.subplot ];
        }

        PlotOverlayMode.prototype.plotTelemetry = function (updater) {
            // Fit to the boundaries of the data, but don't
            // override any user-initiated pan-zoom changes.
            this.panZoomStack.setBasePanZoom(
                updater.getOrigin(),
                updater.getDimensions()
            );

            // Track the domain offset, used to bias domain values
            // to minimize loss of precision when converted to 32-bit
            // floating point values for display.
            this.subplot.setDomainOffset(updater.getDomainOffset());

            // Draw the buffers. Select color by index.
            this.subplot.getDrawingObject().lines =
                updater.getLineBuffers().map(function (buf, i) {
                    return {
                        buffer: buf.getBuffer(),
                        color: PlotPalette.getFloatColor(i),
                        points: buf.getLength()
                    };
                });
        };

        PlotOverlayMode.prototype.getSubPlots = function () {
            return this.subplots;
        };

        PlotOverlayMode.prototype.isZoomed = function () {
            return this.panZoomStack.getDepth() > 1;
        };

        PlotOverlayMode.prototype.stepBackPanZoom = function () {
            this.panZoomStack.popPanZoom();
            this.subplot.update();
        };

        PlotOverlayMode.prototype.unzoom = function () {
            this.panZoomStack.clearPanZoom();
            this.subplot.update();
        };

        return PlotOverlayMode;
    }
);
