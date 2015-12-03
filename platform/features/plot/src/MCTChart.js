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

/**
 * Module defining MCTChart. Created by vwoeltje on 11/12/14.
 */
define(
    ["./GLChart", "./Canvas2DChart"],
    function (GLChart, Canvas2DChart) {
        "use strict";

        var TEMPLATE = "<canvas style='position: absolute; background: none; width: 100%; height: 100%;'></canvas>";

        /**
         * The mct-chart directive provides a canvas element which can be
         * drawn upon, to support Plot view and similar visualizations.
         *
         * This directive takes one attribute, "draw", which is an Angular
         * expression which will be two-way bound to a drawing object. This
         * drawing object should contain:
         *
         * * `dimensions`: An object describing the logical bounds of the
         *   drawable area, containing two fields:
         *   * `origin`: The position, in logical coordinates, of the
         *     lower-left corner of the chart area. A two-element array.
         *   * `dimensions`: A two-element array containing the width
         *     and height of the chart area, in logical coordinates.
         * * `lines`: An array of lines to be drawn, where each line is
         *   expressed as an object containing:
         *   * `buffer`: A Float32Array containing points in the line,
         *     in logical coordinate, in sequential x/y pairs.
         *   * `color`: The color of the line, as a four-element RGBA
         *     array, where each element is in the range of 0.0-1.0
         *   * `points`: The number of points in the line.
         * * `boxes`: An array of rectangles to draw in the chart area
         *   (used for marquee zoom). Each is an object containing:
         *   * `start`: The first corner of the rectangle (as a two-element
         *      array, logical coordinates)
         *   * `end`: The opposite corner of the rectangle (again, as a
         *      two-element array)
         *   * `color`: The color of the box, as a four-element RGBA
         *     array, where each element is in the range of 0.0-1.0
         *
         * @memberof platform/features/plot
         * @constructor
         */
        function MCTChart($interval, $log) {
            // Get an underlying chart implementation
            function getChart(Charts, canvas) {
                // Try the first available option...
                var Chart = Charts[0];

                // This function recursively try-catches all options;
                // if these all fail, issue a warning.
                if (!Chart) {
                    $log.warn("Cannot initialize mct-chart.");
                    return undefined;
                }

                // Try first option; if it fails, try remaining options
                try {
                    return new Chart(canvas);
                } catch (e) {
                    $log.warn([
                        "Could not instantiate chart",
                        Chart.name,
                        ";",
                        e.message
                    ].join(" "));

                    return getChart(Charts.slice(1), canvas);
                }
            }

            function linkChart(scope, element) {
                var canvas = element.find("canvas")[0],
                    activeInterval,
                    chart;

                // Handle drawing, based on contents of the "draw" object
                // in scope
                function doDraw(draw) {
                    // Ensure canvas context has same resolution
                    // as canvas element
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;

                    // Clear previous contents
                    chart.clear();

                    // Nothing to draw if no draw object defined
                    if (!draw) {
                        return;
                    }

                    // Set logical boundaries for the chart
                    chart.setDimensions(
                        draw.dimensions || [1, 1],
                        draw.origin || [0, 0]
                    );

                    // Draw line segments
                    (draw.lines || []).forEach(function (line) {
                        chart.drawLine(
                            line.buffer,
                            line.color,
                            line.points
                        );
                    });

                    // Draw boxes (e.g. marquee zoom rect)
                    (draw.boxes || []).forEach(function (box) {
                        chart.drawSquare(
                            box.start,
                            box.end,
                            box.color
                        );
                    });

                }

                // Issue a drawing call, if-and-only-if canvas size
                // has changed. This will be called on a timer, since
                // there is no event to depend on.
                function drawIfResized() {
                    if (canvas.width !== canvas.offsetWidth ||
                            canvas.height !== canvas.offsetHeight) {
                        doDraw(scope.draw);
                        scope.$apply();
                    }
                }

                // Stop watching for changes to size (scope destroyed)
                function releaseInterval() {
                    if (activeInterval) {
                        $interval.cancel(activeInterval);
                    }
                }

                // Switch from WebGL to plain 2D if context is lost
                function fallbackFromWebGL() {
                    element.html(TEMPLATE);
                    canvas = element.find("canvas")[0];
                    chart = getChart([Canvas2DChart], canvas);
                    if (chart) {
                        doDraw(scope.draw);
                    }
                }

                // Try to initialize a chart.
                chart = getChart([GLChart, Canvas2DChart], canvas);

                // If that failed, there's nothing more we can do here.
                // (A warning will already have been issued)
                if (!chart) {
                    return;
                }

                // WebGL is a bit of a special case; it may work, then fail
                // later for various reasons, so we need to listen for this
                // and fall back to plain canvas drawing when it occurs.
                canvas.addEventListener("webglcontextlost", fallbackFromWebGL);

                // Check for resize, on a timer
                activeInterval = $interval(drawIfResized, 1000, 0, false);

                // Watch "draw" for external changes to the set of
                // things to be drawn.
                scope.$watchCollection("draw", doDraw);

                // Stop checking for resize when scope is destroyed
                scope.$on("$destroy", releaseInterval);
            }

            return {
                // Apply directive only to elements
                restrict: "E",

                // Template to use (a canvas element)
                template: TEMPLATE,

                // Link function; set up scope
                link: linkChart,

                // Initial, isolate scope for the directive
                scope: { draw: "=" }
            };
        }

        /**
         * @interface platform/features/plot.Chart
         * @private
         */

        /**
         * Clear the chart.
         * @method platform/features/plot.Chart#clear
         */
        /**
         * Set the logical boundaries of the chart.
         * @param {number[]} dimensions the horizontal and
         *        vertical dimensions of the chart
         * @param {number[]} origin the horizontal/vertical
         *        origin of the chart
         * @memberof platform/features/plot.Chart#setDimensions
         */
        /**
         * Draw the supplied buffer as a line strip (a sequence
         * of line segments), in the chosen color.
         * @param {Float32Array} buf the line strip to draw,
         *        in alternating x/y positions
         * @param {number[]} color the color to use when drawing
         *        the line, as an RGBA color where each element
         *        is in the range of 0.0-1.0
         * @param {number} points the number of points to draw
         * @memberof platform/features/plot.Chart#drawLine
         */
        /**
         * Draw a rectangle extending from one corner to another,
         * in the chosen color.
         * @param {number[]} min the first corner of the rectangle
         * @param {number[]} max the opposite corner
         * @param {number[]} color the color to use when drawing
         *        the rectangle, as an RGBA color where each element
         *        is in the range of 0.0-1.0
         * @memberof platform/features/plot.Chart#drawSquare
         */

        return MCTChart;
    }
);

