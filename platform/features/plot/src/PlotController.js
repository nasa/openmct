/*global define,moment,Promise*/

/**
 * Module defining PlotController. Created by vwoeltje on 11/12/14.
 */
define(
    [
        "./PlotPreparer",
        "./PlotPalette",
        "./PlotPanZoomStack",
        "./PlotPosition",
        "./PlotTickGenerator",
        "./PlotFormatter",
        "./PlotAxis"
    ],
    function (PlotPreparer, PlotPalette, PlotPanZoomStack, PlotPosition, PlotTickGenerator, PlotFormatter, PlotAxis) {
        "use strict";

        var AXIS_DEFAULTS = [
                { "name": "Time" },
                { "name": "Value" }
            ],
            DOMAIN_TICKS = 5,
            RANGE_TICKS = 7;

        /**
         *
         * @constructor
         */
        function PlotController($scope) {
            var mousePosition,
                marqueeStart,
                panZoomStack = new PlotPanZoomStack([], []),
                formatter = new PlotFormatter(),
                domainOffset;

            // Utility, for map/forEach loops. Index 0 is domain,
            // index 1 is range.
            function formatValue(v, i) {
                return (i ?
                        formatter.formatRangeValue :
                        formatter.formatDomainValue)(v);
            }

            function mousePositionToDomainRange(mousePosition) {
                return new PlotPosition(
                    mousePosition.x,
                    mousePosition.y,
                    mousePosition.width,
                    mousePosition.height,
                    panZoomStack
                ).getPosition();
            }

            function toDisplayable(position) {
                return [ position[0] - domainOffset, position[1] ];
            }

            function updateMarqueeBox() {
                $scope.draw.boxes = marqueeStart ?
                        [{
                            start: toDisplayable(mousePositionToDomainRange(marqueeStart)),
                            end: toDisplayable(mousePositionToDomainRange(mousePosition)),
                            color: [1, 1, 1, 0.5 ]
                        }] : undefined;
            }

            function updateDrawingBounds() {
                var panZoom = panZoomStack.getPanZoom();

                $scope.draw.dimensions = panZoom.dimensions;
                $scope.draw.origin = [
                    panZoom.origin[0] - domainOffset,
                    panZoom.origin[1]
                ];
            }

            function updateTicks() {
                var tickGenerator = new PlotTickGenerator(panZoomStack, formatter);

                $scope.domainTicks =
                    tickGenerator.generateDomainTicks(DOMAIN_TICKS);
                $scope.rangeTicks =
                    tickGenerator.generateRangeTicks(RANGE_TICKS);
            }

            function setupAxes(metadatas) {
                $scope.axes = [
                    new PlotAxis("domain", metadatas, AXIS_DEFAULTS[0]),
                    new PlotAxis("range", metadatas, AXIS_DEFAULTS[1])
                ];
            }

            function plotTelemetry() {
                var prepared, data, telemetry;

                telemetry = $scope.telemetry;

                if (!telemetry) {
                    return;
                }

                if (!$scope.axes) {
                    setupAxes(telemetry.getMetadata());
                }

                data = telemetry.getResponse();

                prepared = new PlotPreparer(
                    data,
                    ($scope.axes[0].active || {}).key,
                    ($scope.axes[1].active || {}).key
                );

                panZoomStack.setBasePanZoom(
                    prepared.getOrigin(),
                    prepared.getDimensions()
                );

                domainOffset = prepared.getDomainOffset();

                $scope.draw.lines = prepared.getBuffers().map(function (buf, i) {
                    return {
                        buffer: buf,
                        color: PlotPalette.getFloatColor(i),
                        points: buf.length / 2
                    };
                });

                updateDrawingBounds();
                updateMarqueeBox();
                updateTicks();
            }

            function toMousePosition($event) {
                var target = $event.target,
                    bounds = target.getBoundingClientRect();

                return {
                    x: $event.clientX - bounds.left,
                    y: $event.clientY - bounds.top,
                    width: bounds.width,
                    height: bounds.height
                };
            }

            function marqueeZoom(start, end) {
                var a = mousePositionToDomainRange(start),
                    b = mousePositionToDomainRange(end),
                    origin = [
                        Math.min(a[0], b[0]),
                        Math.min(a[1], b[1])
                    ],
                    dimensions = [
                        Math.max(a[0], b[0]) - origin[0],
                        Math.max(a[1], b[1]) - origin[1]
                    ];

                panZoomStack.pushPanZoom(origin, dimensions);
                updateTicks();
            }

            $scope.$watch("telemetry.getMetadata()", setupAxes);
            $scope.$on("telemetryUpdate", plotTelemetry);
            $scope.draw = {};

            return {
                getColor: function (index) {
                    return PlotPalette.getStringColor(index);
                },
                getHoverCoordinates: function () {
                    return mousePosition ?
                            mousePositionToDomainRange(
                                mousePosition
                            ).map(formatValue) : [];
                },
                hover: function ($event) {
                    mousePosition = toMousePosition($event);
                    if (marqueeStart) {
                        updateMarqueeBox();
                    }
                },
                startMarquee: function ($event) {
                    mousePosition = marqueeStart = toMousePosition($event);
                    updateMarqueeBox();
                },
                endMarquee: function ($event) {
                    mousePosition = toMousePosition($event);
                    if (marqueeStart) {
                        marqueeZoom(marqueeStart, mousePosition);
                        marqueeStart = undefined;
                        updateMarqueeBox();
                        updateDrawingBounds();
                    }
                },
                isZoomed: function () {
                    return panZoomStack.getDepth() > 1;
                },
                stepBackPanZoom: function () {
                    panZoomStack.popPanZoom();
                    updateDrawingBounds();
                },
                unzoom: function () {
                    panZoomStack.clearPanZoom();
                    updateDrawingBounds();
                }

            };
        }

        return PlotController;
    }
);