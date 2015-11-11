/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
        'use strict';

        /**
         * Provides data to populate a graph in a timeline view.
         * @constructor
         * @param {string} key the resource's identifying key
         * @param {Object.<string,DomainObject>} domainObjects and object
         *        containing key-value pairs where keys are colors, and
         *        values are DomainObject instances to be drawn in that
         *        color
         * @param {TimelineGraphRenderer} renderer a renderer which
         *        can be used to prepare Float32Array instances
         */
        function TimelineGraph(key, domainObjects, renderer) {
            var drawingObject = { origin: [0, 0], dimensions: [0, 0], modified: 0},
                // lines for the drawing object, by swimlane index
                lines = [],
                // min/max seen for a given swimlane, by swimlane index
                extrema = [],
                // current minimum
                min = 0,
                // current maximum
                max = 0,
                // current displayed time span
                duration = 1000,
                // line colors to display
                colors = Object.keys(domainObjects);

            // Get minimum value, ensure there's some room
            function minimum() {
                return (min >= max) ? (max - 1) : min;
            }

            // Get maximum value, ensure there's some room
            function maximum() {
                return (min >= max) ? (min + 1) : max;
            }

            // Update minimum and maximum values
            function updateMinMax() {
                // Find the minimum among plot lines
                min = extrema.map(function (ex) {
                    return ex.min;
                }).reduce(function (a, b) {
                    return Math.min(a, b);
                }, Number.POSITIVE_INFINITY);

                // Do the same for the maximum
                max = extrema.map(function (ex) {
                    return ex.max;
                }).reduce(function (a, b) {
                    return Math.max(a, b);
                }, Number.NEGATIVE_INFINITY);

                // Ensure the infinities don't survive
                min = min === Number.POSITIVE_INFINITY ? max : min;
                min = min === Number.NEGATIVE_INFINITY ? 0 : min;
                max = max === Number.NEGATIVE_INFINITY ? min : max;
            }

            // Change contents of the drawing object (to trigger redraw)
            function updateDrawingObject() {
                // Update drawing object to include non-empty lines
                drawingObject.lines = lines.filter(function (line) {
                    return line.points > 1;
                });

                // Update drawing bounds to fit data
                drawingObject.origin[1] = minimum();
                drawingObject.dimensions[1] = maximum() - minimum();
            }

            // Update a specific line, by index
            function updateLine(graph, index) {
                var buffer = renderer.render(graph),
                    line = lines[index],
                    ex = extrema[index],
                    i;

                // Track minimum/maximum; note we skip x values
                for (i = 1; i < buffer.length; i += 2) {
                    ex.min = Math.min(buffer[i], ex.min);
                    ex.max = Math.max(buffer[i], ex.max);
                }

                // Update line in drawing object
                line.buffer = buffer;
                line.points = graph.getPointCount();
                line.color = renderer.decode(colors[index]);

                // Update the graph's total min/max
                if (line.points > 0) {
                    updateMinMax();
                }

                // Update the drawing object (used to draw the graph)
                updateDrawingObject();
            }

            // Request initialization for a line's contents
            function populateLine(color, index) {
                var domainObject = domainObjects[color],
                    graphPromise = domainObject.useCapability('graph');

                if (graphPromise) {
                    graphPromise.then(function (g) {
                        if (g[key]) {
                            updateLine(g[key], index);
                        }
                    });
                }
            }

            // Create empty lines
            lines = colors.map(function () {
                // Sentinel value to exclude these lines
                return { points: 0 };
            });

            // Specify initial min/max state per-line
            extrema = colors.map(function () {
                return {
                    min: Number.POSITIVE_INFINITY,
                    max: Number.NEGATIVE_INFINITY
                };
            });

            // Start creating lines for all swimlanes
            colors.forEach(populateLine);

            return {
                /**
                 * Get the minimum resource value that appears in this graph.
                 * @returns {number} the minimum value
                 */
                minimum: minimum,
                /**
                 * Get the maximum resource value that appears in this graph.
                 * @returns {number} the maximum value
                 */
                maximum: maximum,
                /**
                 * Set the displayed origin and duration, in milliseconds.
                 * @param {number} [value] value to set, if setting
                 */
                setBounds: function (offset, duration) {
                    // We don't update in-place, because we need the change
                    // to trigger a watch in mct-chart.
                    drawingObject.origin = [ offset, drawingObject.origin[1] ];
                    drawingObject.dimensions = [ duration, drawingObject.dimensions[1] ];
                },
                /**
                 * Redraw lines in this graph.
                 */
                refresh: function () {
                    colors.forEach(populateLine);
                },
                // Expose key, drawing object directly for use in templates
                key: key,
                drawingObject: drawingObject
            };

        }

        return TimelineGraph;
    }
);