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
    ["../SubPlot", "../elements/PlotPalette", "../elements/PlotPanZoomStackGroup"],
    function (SubPlot, PlotPalette, PlotPanZoomStackGroup) {
        "use strict";

        /**
         * Handles plotting in Stacked mode. In stacked mode, there
         * is one sub-plot for each plotted object.
         * @memberof platform/features/plot
         * @constructor
         * @implements {platform/features/plot.PlotModeHandler}
         * @param {DomainObject[]} the domain objects to be plotted
         */
        function PlotStackMode(telemetryObjects, subPlotFactory) {
            var self = this;

            this.panZoomStackGroup =
                new PlotPanZoomStackGroup(telemetryObjects.length);

            this.subplots = telemetryObjects.map(function (telemetryObject, i) {
                    return subPlotFactory.createSubPlot(
                        [telemetryObject],
                        self.panZoomStackGroup.getPanZoomStack(i)
                    );
                });
        }

        PlotStackMode.prototype.plotTelemetryTo = function (subplot, prepared, index) {
            var buffer = prepared.getLineBuffers()[index];

            // Track the domain offset, used to bias domain values
            // to minimize loss of precision when converted to 32-bit
            // floating point values for display.
            subplot.setDomainOffset(prepared.getDomainOffset());

            // Draw the buffers. Always use the 0th color, because there
            // is one line per plot.
            subplot.getDrawingObject().lines = [{
                buffer: buffer.getBuffer(),
                color: PlotPalette.getFloatColor(0),
                points: buffer.getLength()
            }];
        };

        PlotStackMode.prototype.plotTelemetry = function (prepared) {
            var self = this;
            // Fit to the boundaries of the data, but don't
            // override any user-initiated pan-zoom changes.
            this.panZoomStackGroup.setBasePanZoom(
                prepared.getOrigin(),
                prepared.getDimensions()
            );

            this.subplots.forEach(function (subplot, index) {
                self.plotTelemetryTo(subplot, prepared, index);
            });
        };

        PlotStackMode.prototype.getSubPlots = function () {
            return this.subplots;
        };

        PlotStackMode.prototype.isZoomed = function () {
            return this.panZoomStackGroup.getDepth() > 1;
        };

        PlotStackMode.prototype.stepBackPanZoom = function () {
            this.panZoomStackGroup.popPanZoom();
            this.subplots.forEach(function (subplot) {
                subplot.update();
            });
        };

        PlotStackMode.prototype.unzoom = function () {
            this.panZoomStackGroup.clearPanZoom();
            this.subplots.forEach(function (subplot) {
                subplot.update();
            });
        };

        return PlotStackMode;
    }
);
