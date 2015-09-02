/*global define,window*/

define(
    [
        '../lib/utils'
    ],
    function (utils) {
        "use strict";

        var RANGE_TICK_COUNT = 7,
            DOMAIN_TICK_COUNT = 5,
            ZOOM_AMT = 0.02,
            PINCH_DRAG_AMT = 2;

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

                var dragStart,
                    marqueeBox = {},
                    marqueeRect, // Set when exists.
                    chartElementBounds,
                    firstTouch,
                    firstTouchDistance,
                    prevTouchDistance,
                    $canvas = $element.find('canvas');

                function updateAxesForCurrentViewport() {
                    // Update axes definitions for current viewport.
                    ['domain', 'range'].forEach(function (axisName) {
                        var axis = $scope.axes[axisName],
                            firstTick = $scope.viewport.topLeft[axisName],
                            lastTick = $scope.viewport.bottomRight[axisName],
                            axisSize = firstTick - lastTick,
                            denominator = axis.tickCount - 1,
                            tickNumber,
                            tickIncrement,
                            tickValue;
                        // Yes, ticksize is negative for domain and positive for range.
                        // It's because ticks are generated/displayed top to bottom and left to right.
                        axis.ticks = [];
                        for (tickNumber = 0; tickNumber < axis.tickCount; tickNumber = tickNumber + 1) {
                            tickIncrement = (axisSize * (tickNumber / denominator));
                            tickValue = firstTick - tickIncrement;
                            axis.ticks.push(
                                tickValue
                            );
                        }
                    });
                }

                function drawMarquee() {
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
                    } else if (marqueeRect && $scope.rectangles.indexOf(marqueeRect) !== -1) {
                        $scope.rectangles.splice($scope.rectangles.indexOf(marqueeRect));
                        marqueeRect = undefined;
                        $scope.$broadcast('rectangle-change');
                    }
                }

                function untrackMousePosition() {
                    $scope.mouseCoordinates = undefined;
                }
                function updateMarquee() {
                    // Update the marquee box in progress.
                    marqueeBox.end = $scope.mouseCoordinates.positionAsPlotPoint;
                    drawMarquee();
                }
                function startMarquee() {
                    marqueeBox.start = $scope.mouseCoordinates.positionAsPlotPoint;
                }
                function endMarquee() {
                    // marqueeBox start/end are opposite corners but we need
                    // topLeft and bottomRight.
                    var boxPoints = utils.boxPointsFromOppositeCorners(marqueeBox.start, marqueeBox.end),
                        newViewport = utils.oppositeCornersFromBoxPoints(boxPoints);

                    marqueeBox = {};
                    drawMarquee();
                    $scope.$emit('user:viewport:change:end', newViewport);
                    $scope.viewport = newViewport;
                }

                function startDrag($event) {
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
                }

                function updateDrag() {
                    // calculate offset between points.  Apply that offset to viewport.
                    var newPosition = $scope.mouseCoordinates.positionAsPlotPoint,
                        dDomain = dragStart.domain - newPosition.domain,
                        dRange = dragStart.range - newPosition.range;

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
                }

                function endDrag() {
                    dragStart = undefined;
                    $scope.$emit('user:viewport:change:end', $scope.viewport);
                }

                //
                function trackTouchPosition(touchPosition, bounds) {
                    var positionOverElement,
                        positionAsPlotPoint,
                        position;
                    
                    chartElementBounds = bounds;
                    
                    positionOverElement = {
                        x: touchPosition.clientX - bounds.left,
                        y: touchPosition.clientY - bounds.top
                    };
                    
                    positionAsPlotPoint = utils.elementPositionAsPlotPosition(
                        positionOverElement,
                        bounds,
                        $scope.viewport
                    );

                    position = {
                        positionOverElement: positionOverElement,
                        positionAsPlotPoint: positionAsPlotPoint
                    };
                    
                    return position;
                }

                function trackMousePosition($event) {
                    // Calculate coordinates of mouse related to canvas and as
                    // domain, range value and make available in scope for display.

                    var bounds = $event.target.getBoundingClientRect(),
                        positionOverElement,
                        positionAsPlotPoint;

                    chartElementBounds = bounds;

                    
                    positionOverElement = {
                        x: $event.clientX - bounds.left,
                        y: $event.clientY - bounds.top
                    };

                    positionAsPlotPoint = utils.elementPositionAsPlotPosition(
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
                }

                function watchForMarquee() {
                    $canvas.removeClass('plot-drag');
                    $canvas.addClass('plot-marquee');
                    $canvas.on('mousedown', startMarquee);
                    $canvas.on('mouseup', endMarquee);
                    $canvas.off('mousedown', startDrag);
                    $canvas.off('mouseup', endDrag);
                }

                function watchForDrag() {
                    $canvas.addClass('plot-drag');
                    $canvas.removeClass('plot-marquee');
                    $canvas.on('mousedown', startDrag);
                    $canvas.on('mouseup', endDrag);
                    $canvas.off('mousedown', startMarquee);
                    $canvas.off('mouseup', endMarquee);
                }

                function toggleInteractionMode(event) {
                    if (event.keyCode === 16) { // shift key.
                        watchForDrag();
                    }
                }

                function resetInteractionMode(event) {
                    if (event.keyCode === 16) {
                        watchForMarquee();
                    }
                }

                function stopWatching() {
                    $canvas.off('mousedown', startDrag);
                    $canvas.off('mouseup', endDrag);
                    $canvas.off('mousedown', startMarquee);
                    $canvas.off('mouseup', endMarquee);
                    window.removeEventListener('keydown', toggleInteractionMode);
                    window.removeEventListener('keyup', resetInteractionMode);
                }

                $canvas.on('mousemove', trackMousePosition);
                $canvas.on('mouseleave', untrackMousePosition);
                watchForMarquee();

                window.addEventListener('keydown', toggleInteractionMode);
                window.addEventListener('keyup', resetInteractionMode);

                function onViewportChange() {
                    if ($scope.mouseCoordinates && chartElementBounds) {
                        $scope.mouseCoordinates.positionAsPlotPoint =
                            utils.elementPositionAsPlotPosition(
                                $scope.mouseCoordinates.positionOverElement,
                                chartElementBounds,
                                $scope.viewport
                            );
                    }
                    // TODO: Discuss whether marqueeBox start should be fixed to data or fixed to canvas element, especially when "isLive is true".
                    updateAxesForCurrentViewport();
                }

                // Updates viewport based on touch location and current event bounds
                function updatePan(touch, bounds) {

                    // Sets the panPosition plot point (relative to chart)
                    // and calculates domain/range by subtracting first touch's
                    // plot point and current touch's plot point
                    var panPosition = trackTouchPosition(touch, bounds).positionAsPlotPoint,
                        dDomain = firstTouch.domain - panPosition.domain,
                        dRange = firstTouch.range - panPosition.range;

                    // Viewport is set to calculated delta domain/range
                    $scope.viewport = {
                        topLeft: {
                            domain: (($scope.viewport.topLeft.domain) + dDomain),
                            range: (($scope.viewport.topLeft.range) + dRange)
                        },
                        bottomRight: {
                            domain: (($scope.viewport.bottomRight.domain) + dDomain),
                            range: (($scope.viewport.bottomRight.range) + dRange)
                        }
                    };
                }

                // Starts the pan by emitting that viewport will be changed
                // also sets the first touch variable
                function startPan(touch, bounds) {
                    $scope.$emit('user:viewport:change:start');
                    firstTouch = trackTouchPosition(touch, bounds).positionAsPlotPoint;
                }

                // Receives the emit of single touch pan start
                function onPanStart(event, touch) {
                    startPan(touch.touch, touch.bounds);
                }

                // Receives the emit of single touch pan change
                function onPanChange(event, touch) {
                    updatePan(touch.touch, touch.bounds);
                }

                // Sets the dimensions of the midpoint's domain and range distance to the
                // top left and bottom right corners of the viewport. Used to zoom relative to
                // midpoint pinch gestures 2 touches.
                function setDimensions(midpoint) {
                    return {
                        tl: {
                            domain: Math.abs(midpoint.domain - ($scope.viewport.topLeft.domain)),
                            range: Math.abs(midpoint.range - ($scope.viewport.topLeft.range))
                        },
                        br: {
                            domain: Math.abs(($scope.viewport.bottomRight.domain) - midpoint.domain),
                            range: Math.abs(($scope.viewport.bottomRight.range) - midpoint.range)
                        }
                    };
                }

                // Calculates the viewport for a zoom gesture
                function calculateViewport(midpoint, ratio) {

                    // Uses the distance ratio passed in and the
                    // zoom amount (variable set at top) to find the
                    // amount of zoom per change in pinch gesture and
                    // whether it is zooming in or out
                    var zoomTL, zoomBR,
                        dimensions = setDimensions(midpoint),
                        checkRatio = (ratio - 1) || 0,
                        type = (-1 * (checkRatio / Math.abs(checkRatio))) || 1,
                        zoomAmt = type * ZOOM_AMT;

                    // Sets the domain/range difference to applied to the
                    // top left and bottom right plot points
                    zoomTL = {
                        domain: zoomAmt * dimensions.tl.domain,
                        range: zoomAmt * dimensions.tl.range
                    };
                    zoomBR = {
                        domain: zoomAmt * dimensions.br.domain,
                        range: zoomAmt * dimensions.br.range
                    };

                    // Applies and returns the changed for zoom top left and bottom right
                    // plot points
                    return {
                        topLeft: {
                            domain: (($scope.viewport.topLeft.domain) + zoomTL.domain),
                            range: (($scope.viewport.topLeft.range) - zoomTL.range)
                        },
                        bottomRight: {
                            domain: (($scope.viewport.bottomRight.domain) - zoomBR.domain),
                            range: (($scope.viewport.bottomRight.range) + zoomBR.range)
                        }
                    };
                }

                // Updates the viewport based on the amount of zooming (pinching) user is doing
                function updateZoom(midpoint, bounds, distance) {

                    // Gets the current midpoint and distance ratio to be used to
                    // calculate new viewport
                    var midpointPosition = trackTouchPosition(midpoint, bounds).positionAsPlotPoint,
                        distanceRatio = ((prevTouchDistance || firstTouchDistance) / distance);

                    // Sets the new viewport
                    $scope.viewport = calculateViewport(midpointPosition, distanceRatio);
                }

                // Starts the zoom by emitting that viewport will be changed
                // also sets the first touch variable (midpoint) if panning will
                // happen and sets the distance between the first touches occurring
                function startZoom(midpoint, bounds, distance) {
                    $scope.$emit('user:viewport:change:start');
                    firstTouchDistance = distance;
                    firstTouch = trackTouchPosition(midpoint, bounds).positionAsPlotPoint;
                }

                // Receives the emit of the start of pinch touch
                function onPinchStart(event, touch) {
                    startZoom(touch.midpoint, touch.bounds, touch.distance);
                }

                function comparePinchDrag(distance, prevDistance) {
                    return ((prevDistance + PINCH_DRAG_AMT) >= distance) &&
                        ((prevDistance - PINCH_DRAG_AMT) <= distance);
                }

                // Receives the emit of the change of pinch touch,
                // differentiates between a pan and zoom
                function onPinchChange(event, touch) {

                    // Will pan if change in distance is within PINCH_DRAG_AMT
                    // range relative to the previous distance
                    if(comparePinchDrag(Math.round(touch.distance),
                            Math.round(prevTouchDistance || firstTouchDistance))) {
                        updatePan(touch.midpoint, touch.bounds);
                    }
                    // Will pinch in any other situation that the distance between
                    // pinching touches is increasing or decreasing by more than
                    // PINCH_DRAG_AMT
                    else {
                        updateZoom(touch.midpoint, touch.bounds, touch.distance);
                    }

                    // Sets previous touch distance to current touch.distance
                    prevTouchDistance = touch.distance;
                }

                // Receives emit for touch event ending and emits that the
                // viewport has stopped changing.
                function onTouchEnd() {
                    $scope.$emit('user:viewport:change:end', $scope.viewport);
                }

                $scope.$on('mct:pinch:start', onPinchStart);
                $scope.$on('mct:pinch:change', onPinchChange);

                $scope.$on('mct:pan:start', onPanStart);
                $scope.$on('mct:pan:change', onPanChange);

                $scope.$on('mct:ptouch:end', onTouchEnd);

                $scope.$on('$destroy', stopWatching);

                $scope.$watchCollection('viewport', onViewportChange);
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
