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
                 * @memberof platform/features/plot.PlotStackMode#
                 */
                plotTelemetry: plotTelemetry,
                /**
                 * Get all sub-plots to be displayed in this mode; used
                 * to populate the plot template.
                 * @return {SubPlot[]} all sub-plots to display in this mode
                 * @memberof platform/features/plot.PlotStackMode#
                 */
                getSubPlots: function () {
                    return subplots;
                },
                /**
                 * Check if we are not in our base pan-zoom state (that is,
                 * there are some temporary user modifications to the
                 * current pan-zoom state.)
                 * @returns {boolean} true if not in the base pan-zoom state
                 * @memberof platform/features/plot.PlotStackMode#
                 */
                isZoomed: function () {
                    return panZoomStackGroup.getDepth() > 1;
                },
                /**
                 * Undo the most recent pan/zoom change and restore
                 * the prior state.
                 * @memberof platform/features/plot.PlotStackMode#
                 */
                stepBackPanZoom: function () {
                    panZoomStackGroup.popPanZoom();
                    subplots.forEach(function (subplot) {
                        subplot.update();
                    });
                },
                /**
                 * Undo all pan/zoom changes and restore the initial state.
                 * @memberof platform/features/plot.PlotStackMode#
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
