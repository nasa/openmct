/*global define,requestAnimationFrame,Float32Array*/

/**
 * Module defining MCTChart. Created by vwoeltje on 11/12/14.
 */
define(
    ["../draw/DrawLoader"],
    function (DrawLoader) {
        "use strict";

        var TEMPLATE = "<canvas style='position: absolute; background: none; width: 100%; height: 100%;'></canvas>";

        /**
         * MCTChart draws charts utilizing a drawAPI.
         *
         * @constructor
         */
        function MCTChart($interval) {

            function linkChart($scope, $element) {
                var canvas = $element.find("canvas")[0],
                    isDestroyed = false,
                    activeInterval,
                    drawAPI,
                    lines = [];

                drawAPI = DrawLoader.getDrawAPI(canvas);

                if (!drawAPI) {
                    return;
                }

                function redraw() {
                    if (isDestroyed) {
                        return;
                    }
                    requestAnimationFrame(redraw);
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    drawAPI.clear();
                    updateViewport();
                    drawSeries();
                    drawRectangles();
                }

                function drawIfResized() {
                    if (canvas.width !== canvas.offsetWidth ||
                            canvas.height !== canvas.offsetHeight) {
                        redraw();
                    }
                }

                function destroyChart() {
                    isDestroyed = true;
                    if (activeInterval) {
                        $interval.cancel(activeInterval);
                    }
                }

                function drawSeries() {
                    // TODO: Don't regenerate lines on each frame.
                    lines = $scope.series.map(lineFromSeries);
                    lines.forEach(function(line) {
                        drawAPI.drawLine(
                            line.buffer,
                            line.color,
                            line.pointCount
                        );
                    });
                }

                function drawRectangles() {
                    if ($scope.rectangles) {
                        $scope.rectangles.forEach(function(rect) {
                            drawAPI.drawSquare(
                                [rect.start.domain, rect.start.range],
                                [rect.end.domain, rect.end.range],
                                rect.color
                            );
                        });
                    }
                }

                function updateViewport() {
                    var dimensions = [
                        Math.abs($scope.viewport.topLeft.domain - $scope.viewport.bottomRight.domain),
                        Math.abs($scope.viewport.topLeft.range - $scope.viewport.bottomRight.range)
                    ];

                    var origin = [
                        $scope.viewport.topLeft.domain,
                        $scope.viewport.bottomRight.range
                    ];

                    drawAPI.setDimensions(
                        dimensions,
                        origin
                    );
                }

                function lineFromSeries(series) {
                    // TODO: handle when lines get longer than 10,000 points.
                    // Each line allocates 10,000 points.  This should be more
                    // that we ever need, but we have to decide how to handle
                    // this at the higher level.  I imagine the plot controller
                    // should watch it's series and when they get huge, slice
                    // them in half and delete the oldest half.
                    //
                    // As long as the controller replaces $scope.series with a
                    // new series object, then this directive will
                    // automatically generate new arrays for those lines.
                    // In practice, the overhead of regenerating these lines
                    // appears minimal.
                    var lineBuffer = new Float32Array(20000);
                    for (var i = 0; i < series.data.length; i++) {
                        lineBuffer[2*i] = series.data[i].domain;
                        lineBuffer[2*i+1] = series.data[i].range;
                    }
                    return {
                        color: series.color,
                        buffer: lineBuffer,
                        pointCount: series.data.length
                    };
                }

                function initializeLines() {
                    lines = $scope.series.map(lineFromSeries);
                }

                function onSeriesDataAdd(event, seriesIndex, points) {
                    var line = lines[seriesIndex];
                    points.forEach(function (point) {
                        line.buffer[2*line.pointCount] = point.domain;
                        line.buffer[2*line.pointCount+1] = point.range;
                        line.pointCount += 1;
                    });
                }

                // Check for resize, on a timer
                activeInterval = $interval(drawIfResized, 1000);

                // Initialize series
                $scope.$watch('series', initializeLines);
                $scope.$on('series:data:add', onSeriesDataAdd);
                redraw();

                // Stop checking for resize when $scope is destroyed
                $scope.$on("$destroy", destroyChart);
            }

            return {
                // Apply directive only to $elements
                restrict: "E",

                // Template to use (a canvas $element)
                template: TEMPLATE,

                // Link function; set up $scope
                link: linkChart,

                // Initial, isolate $scope for the directive
                scope: {
                    draw: "=" ,
                    rectangles: "=",
                    series: "=",
                    viewport: "="
                }
            };
        }

        return MCTChart;
    }
);
