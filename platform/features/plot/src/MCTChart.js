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
                    }
                }

                // Stop watching for changes to size (scope destroyed)
                function releaseInterval() {
                    if (activeInterval) {
                        $interval.cancel(activeInterval);
                    }
                }

                // Try to initialize a chart.
                chart = getChart([GLChart, Canvas2DChart], canvas);

                // If that failed, there's nothing more we can do here.
                // (A warning will already have been issued)
                if (!chart) {
                    return;
                }

                // Check for resize, on a timer
                activeInterval = $interval(drawIfResized, 1000);

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

        return MCTChart;
    }
);