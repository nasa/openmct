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
         * Offsetter adjusts domain and range values by a fixed amount,
         * generally increasing the precision of the 32 bit float representation
         * required for plotting.
         *
         * @constructor
         */
        function Offsetter(domainOffset, rangeOffset) {
            this.domainOffset = domainOffset;
            this.rangeOffset = rangeOffset;
        }

        Offsetter.prototype.domain = function(dataDomain) {
            return dataDomain - this.domainOffset;
        };

        Offsetter.prototype.range = function(dataRange) {
            return dataRange - this.rangeOffset;
        };

        /**
         * MCTChart draws charts utilizing a drawAPI.
         *
         * @constructor
         */
        function MCTChart($interval, $log, agentService) {

            function linkChart($scope, $element) {
                var canvas = $element.find("canvas")[0],
                    isDestroyed = false,
                    activeInterval,
                    drawAPI,
                    lines = [],
                    offset;

                drawAPI = DrawLoader.getDrawAPI(canvas);

                if (!drawAPI) {
                    return;
                }

                function createOffset() {
                    if (offset) {
                        return;
                    }
                    if (!$scope.viewport ||
                        !$scope.viewport.topLeft ||
                        !$scope.viewport.bottomRight) {
                        return;
                    }
                    offset = new Offsetter(
                        $scope.viewport.topLeft.domain,
                        $scope.viewport.topLeft.range
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
                    var lineBuffer = new Float32Array(20000),
                        i = 0;
                    for (i = 0; i < series.data.length; i++) {
                        lineBuffer[2*i] = offset.domain(series.data[i].domain);
                        lineBuffer[2*i+1] = offset.range(series.data[i].range);
                    }
                    return {
                        color: series.color,
                        buffer: lineBuffer,
                        pointCount: series.data.length
                    };
                }

                function drawSeries() {
                    // TODO: Don't regenerate lines on each frame.
                    if (!$scope.series || !$scope.series.length) {
                        return;
                    }
                    lines = $scope.series.map(lineFromSeries);
                    lines.forEach(function(line) {
                        drawAPI.drawLine(
                            line.buffer,
                            line.color.asRGBAArray(),
                            line.pointCount
                        );
                    });
                }

                function drawRectangles() {
                    if ($scope.rectangles) {
                        $scope.rectangles.forEach(function(rect) {
                            drawAPI.drawSquare(
                                [
                                    offset.domain(rect.start.domain),
                                    offset.range(rect.start.range)
                                ],
                                [
                                    offset.domain(rect.end.domain),
                                    offset.range(rect.end.range)
                                ],
                                rect.color
                            );
                        });
                    }
                }

                function updateViewport() {
                    var dimensions,
                        origin;

                    dimensions = [
                        Math.abs(
                            offset.domain($scope.viewport.topLeft.domain) -
                            offset.domain($scope.viewport.bottomRight.domain)
                        ),
                        Math.abs(
                            offset.range($scope.viewport.topLeft.range) -
                            offset.range($scope.viewport.bottomRight.range)
                        )
                    ];

                    origin = [
                        offset.domain(
                            $scope.viewport.topLeft.domain
                        ),
                        offset.range(
                            $scope.viewport.bottomRight.range
                        )
                    ];

                    drawAPI.setDimensions(
                        dimensions,
                        origin
                    );
                }

                function onSeriesDataAdd(event, seriesIndex, points) {
                    var line = lines[seriesIndex];
                    points.forEach(function (point) {
                        line.buffer[2*line.pointCount] = offset.domain(point.domain);
                        line.buffer[2*line.pointCount+1] = offset.range(point.range);
                        line.pointCount += 1;
                    });
                }



                function redraw() {
                    if (isDestroyed) {
                        return;
                    }

                    requestAnimationFrame(redraw);
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    drawAPI.clear();
                    createOffset();
                    if (!offset) {
                        return;
                    }
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

                // Check for resize, on a timer, the timer is 15
                // on mobile (to allow quick refresh of drawing).
                if(agentService.isMobile(navigator.userAgent)) {
                    activeInterval = $interval(drawIfResized, 15, false);
                } else {
                    activeInterval = $interval(drawIfResized, 1000, false);
                }

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
