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
    [],
    function () {
        "use strict";

        /**
         * The PlotTickGenerator provides labels for ticks along the
         * domain and range axes of the plot, to support the plot
         * template.
         *
         * @memberof platform/features/plot
         * @constructor
         * @param {PlotPanZoomStack} panZoomStack the pan-zoom stack for
         *        this plot, used to determine plot boundaries
         * @param {TelemetryFormatter} formatter used to format (for display)
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
                 * @memberof platform/features/plot.PlotTickGenerator#
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
                 * @memberof platform/features/plot.PlotTickGenerator#
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
