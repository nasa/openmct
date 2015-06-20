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
         * @constructor
         * @param {DomainObject[]} the domain objects to be plotted
         */
        function PlotOverlayMode(telemetryObjects, subPlotFactory) {
            var domainOffset,
                panZoomStack = new PlotPanZoomStack([], []),
                subplot = subPlotFactory.createSubPlot(
                    telemetryObjects,
                    panZoomStack
                ),
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
                subplot.setDomainOffset(prepared.getDomainOffset());

                // Draw the buffers. Select color by index.
                subplot.getDrawingObject().lines = prepared.getLineBuffers().map(function (buf, i) {
                    return {
                        buffer: buf.getBuffer(),
                        color: PlotPalette.getFloatColor(i),
                        points: buf.getLength()
                    };
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
                    return panZoomStack.getDepth() > 1;
                },
                /**
                 * Undo the most recent pan/zoom change and restore
                 * the prior state.
                 */
                stepBackPanZoom: function () {
                    panZoomStack.popPanZoom();
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