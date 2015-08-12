/*global define,window*/

define(
    [
        '../lib/utils'
    ],
    function (utils) {
        "use strict";

        var RANGE_TICK_COUNT = 7;
        var DOMAIN_TICK_COUNT = 5;

        function MCTPlot() {

            function link($scope, $element) {
                // Now that we're here, let's handle some scope management that the controller would otherwise handle.

                if (typeof $scope.rectangles === "undefined") {
                    $scope.rectangles = [];
                }
                if (typeof $scope.displayableRange === "undefined") {
                    $scope.displayableRange = function (x) { return x; };
                }
                if (typeof $scope.displayableDomain === "undefined") {
                    $scope.displayableDomain = function (x) { return x; };
                }
                if (typeof $scope.axes === "undefined") {
                    $scope.axes = {
                        domain: {
                            label: "Time",
                            tickCount: DOMAIN_TICK_COUNT,
                            ticks: []
                        },
                        range: {
                            label: "Value",
                            tickCount: RANGE_TICK_COUNT,
                            ticks: []
                        }
                    };
                }


                var dragStart;
                var marqueeBox = {};
                var marqueeRect; // Set when exists.
                var chartElementBounds;
                var $canvas = $element.find('canvas');

                var updateAxesForCurrentViewport = function() {
                    // Update axes definitions for current viewport.
                    ['domain', 'range'].forEach(function(axisName) {
                        var axis = $scope.axes[axisName];
                        var firstTick = $scope.viewport.topLeft[axisName];
                        var lastTick = $scope.viewport.bottomRight[axisName];
                        var axisSize = firstTick - lastTick;
                        var denominator = axis.tickCount - 1;
                        // Yes, ticksize is negative for domain and positive for range.
                        // It's because ticks are generated/displayed top to bottom and left to right.
                        axis.ticks = [];
                        for (var tickNumber = 0; tickNumber < axis.tickCount; tickNumber++) {
                            var tickIncrement = (axisSize * (tickNumber / denominator));
                            var tickValue = firstTick - tickIncrement;
                            axis.ticks.push(
                                tickValue
                            );
                        }
                    });
                };

                var drawMarquee = function() {
                    // Create rectangle for Marquee if it should be set.
                    if (marqueeBox && marqueeBox.start && marqueeBox.end) {
                        if (!marqueeRect) {
                            marqueeRect = {};
                            $scope.rectangles.push(marqueeRect);
                        }
                        marqueeRect.start = marqueeBox.start;
                        marqueeRect.end = marqueeBox.end;
                        marqueeRect.color = [1, 1, 1, 0.5];
                        marqueeRect.layer = 'top'; // TODO: implement this.
                        $scope.$broadcast('rectangle-change');
                    } else if (marqueeRect && $scope.rectangles.indexOf(marqueeRect) != -1) {
                        $scope.rectangles.splice($scope.rectangles.indexOf(marqueeRect));
                        marqueeRect = undefined;
                        $scope.$broadcast('rectangle-change');
                    }
                };

                var untrackMousePosition = function() {
                    $scope.mouseCoordinates = undefined;
                };

                var trackMousePosition = function($event) {
                    // Calculate coordinates of mouse related to canvas and as
                    // domain, range value and make available in scope for display.

                    var bounds = $event.target.getBoundingClientRect();
                    chartElementBounds = bounds;

                    var positionOverElement = {
                        x: $event.clientX - bounds.left,
                        y: $event.clientY - bounds.top
                    };

                    var positionAsPlotPoint = utils.elementPositionAsPlotPosition(
                        positionOverElement,
                        bounds,
                        $scope.viewport
                    );

                    $scope.mouseCoordinates = {
                        positionOverElement: positionOverElement,
                        positionAsPlotPoint: positionAsPlotPoint
                    };

                    if (marqueeBox && marqueeBox.start) {
                        updateMarquee();
                    }

                    if (dragStart) {
                        updateDrag();
                    }
                };

                var startMarquee = function() {
                    marqueeBox.start = $scope.mouseCoordinates.positionAsPlotPoint;
                };

                var updateMarquee = function() {
                    // Update the marquee box in progress.
                    marqueeBox.end = $scope.mouseCoordinates.positionAsPlotPoint;
                    drawMarquee();
                };

                var endMarquee = function() {
                    // marqueeBox start/end are opposite corners but we need
                    // topLeft and bottomRight.
                    var boxPoints = utils.boxPointsFromOppositeCorners(marqueeBox.start, marqueeBox.end);
                    var newViewport = utils.oppositeCornersFromBoxPoints(boxPoints);

                    marqueeBox = {};
                    drawMarquee();
                    $scope.$emit('user:viewport:change:end', newViewport);
                    $scope.viewport = newViewport;
                };

                var startDrag = function($event) {
                    $scope.$emit('user:viewport:change:start');
                    if (!$scope.mouseCoordinates) {
                        return;
                    }
                    $event.preventDefault();
                    // Track drag location relative to position over element
                    // not domain, as chart viewport will change as we drag.
                    dragStart = $scope.mouseCoordinates.positionAsPlotPoint;
                    // Tell controller that we're starting to navigate.
                    return false;
                };

                var updateDrag = function() {
                    // calculate offset between points.  Apply that offset to viewport.
                    var newPosition = $scope.mouseCoordinates.positionAsPlotPoint;
                    var dDomain = dragStart.domain - newPosition.domain;
                    var dRange = dragStart.range - newPosition.range;

                    $scope.viewport = {
                        topLeft: {
                            domain: $scope.viewport.topLeft.domain + dDomain,
                            range: $scope.viewport.topLeft.range + dRange
                        },
                        bottomRight: {
                            domain: $scope.viewport.bottomRight.domain + dDomain,
                            range: $scope.viewport.bottomRight.range + dRange
                        }
                    };
                };

                var endDrag = function() {
                    dragStart = undefined;
                    $scope.$emit('user:viewport:change:end', $scope.viewport);
                };

                var watchForMarquee = function() {
                    $canvas.removeClass('plot-drag');
                    $canvas.addClass('plot-marquee');
                    $canvas.on('mousedown', startMarquee);
                    $canvas.on('mouseup', endMarquee);
                    $canvas.off('mousedown', startDrag);
                    $canvas.off('mouseup', endDrag);
                };

                var watchForDrag = function() {
                    $canvas.addClass('plot-drag');
                    $canvas.removeClass('plot-marquee');
                    $canvas.on('mousedown', startDrag);
                    $canvas.on('mouseup', endDrag);
                    $canvas.off('mousedown', startMarquee);
                    $canvas.off('mouseup', endMarquee);
                };

                var stopWatching = function() {
                    $canvas.off('mousedown', startDrag);
                    $canvas.off('mouseup', endDrag);
                    $canvas.off('mousedown', startMarquee);
                    $canvas.off('mouseup', endMarquee);
                    window.removeEventListener('keydown', toggleInteractionMode);
                    window.removeEventListener('keyup', resetInteractionMode);
                };

                var toggleInteractionMode = function(event) {
                    if (event.keyCode == '18') { // control key.
                        watchForDrag();
                    }
                };

                var resetInteractionMode = function(event) {
                    if (event.keyCode == '18') {
                        watchForMarquee();
                    }
                };

                $canvas.on('mousemove', trackMousePosition);
                $canvas.on('mouseleave', untrackMousePosition);
                watchForMarquee();

                window.addEventListener('keydown', toggleInteractionMode);
                window.addEventListener('keyup', resetInteractionMode);

                var onViewportChange = function() {
                    if ($scope.mouseCoordinates && chartElementBounds) {
                        $scope.mouseCoordinates.positionAsPlotPoint =
                            utils.elementPositionAsPlotPosition(
                                $scope.mouseCoordinates.positionOverElement,
                                chartElementBounds,
                                $scope.viewport
                            );
                    }
                    if (marqueeBox && marqueeBox.start) {
                        // TODO: Discuss whether marqueeBox start should be fixed to data or fixed to canvas element, especially when "isLive is true".
                    }
                    updateAxesForCurrentViewport();
                };

                $scope.$watchCollection('viewport', onViewportChange);

                $scope.$on('$destroy', stopWatching);

            }

            return {
                restrict: "E",
                templateUrl: 'platform/features/plot-reborn/res/templates/mct-plot.html',
                link: link,
                scope: {
                    viewport: "=",
                    series: "=",
                    rectangles: "=?",
                    axes: "=?",
                    displayableRange: "=?",
                    displayableDomain: "=?"
                }
            };
        }

        return MCTPlot;
    }
);
