/*global define,moment,Promise*/

/**
 * Module defining PlotController. Created by vwoeltje on 11/12/14.
 */
define(
    ["./GLPlotPreparer", "./PlotPalette", "../lib/moment.min.js"],
    function (GLPlotPreparer, PlotPalette) {
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
                panZoomStack = [{
                    dimensions: [],
                    origin: []
                }],
                domainOffset;

            function formatDomainValue(v) {
                return moment.utc(v).format("YYYY-DDD HH:mm:ss");
            }

            function formatRangeValue(v) {
                return v.toFixed(1);
            }

            // Utility, for map/forEach loops. Index 0 is domain,
            // index 1 is range.
            function formatValue(v, i) {
                return (i ? formatRangeValue : formatDomainValue)(v);
            }


            function pixelToDomainRange(x, y, width, height, domainOffset) {
                var panZoom = panZoomStack[panZoomStack.length - 1],
                    offset = [ domainOffset || 0, 0],
                    origin = panZoom.origin,
                    dimensions = panZoom.dimensions;

                if (!dimensions || !origin) {
                    return [];
                }

                return [ x / width, (height - y) / height ].map(function (v, i) {
                    return v * dimensions[i] + origin[i] + offset[i];
                });
            }

            function mousePositionToDomainRange(mousePosition, domainOffset) {
                return pixelToDomainRange(
                    mousePosition.x,
                    mousePosition.y,
                    mousePosition.width,
                    mousePosition.height,
                    domainOffset
                );
            }

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

            function updateMarqueeBox() {
                $scope.draw.boxes = marqueeStart ?
                        [{
                            start: mousePositionToDomainRange(marqueeStart),
                            end: mousePositionToDomainRange(mousePosition),
                            color: [1, 1, 1, 0.5 ]
                        }] : undefined;
            }

            function updateDrawingBounds() {
                var panZoom = panZoomStack[panZoomStack.length - 1];

                $scope.draw.dimensions = panZoom.dimensions;
                $scope.draw.origin = panZoom.origin;
            }


            function plotTelemetry() {
                var telemetry, prepared, data;

                telemetry = $scope.telemetry;

                if (!telemetry) {
                    return;
                }

                data = telemetry.getResponse();

                prepared = new GLPlotPreparer(
                    data,
                    ($scope.axes[0].active || {}).key,
                    ($scope.axes[1].active || {}).key
                );

                $scope.axes[0].ticks = generateTicks(
                    prepared.getOrigin()[0] + prepared.getDomainOffset(),
                    prepared.getDimensions()[0],
                    DOMAIN_TICKS,
                    formatDomainValue
                );
                $scope.axes[1].ticks = generateTicks(
                    prepared.getOrigin()[1],
                    prepared.getDimensions()[1],
                    RANGE_TICKS,
                    formatRangeValue
                );

                panZoomStack[0] = {
                    origin: prepared.getOrigin(),
                    dimensions: prepared.getDimensions()
                };

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
            }

            function setupAxes(metadatas) {
                var domainKeys = {},
                    rangeKeys = {},
                    domains = [],
                    ranges = [];

                function buildOptionsForMetadata(m) {
                    (m.domains || []).forEach(function (domain) {
                        if (!domainKeys[domain.key]) {
                            domainKeys[domain.key] = true;
                            domains.push(domain);
                        }
                    });
                    (m.ranges || []).forEach(function (range) {
                        if (!rangeKeys[range.key]) {
                            rangeKeys[range.key] = true;
                            ranges.push(range);
                        }
                    });
                }

                (metadatas || []).
                    forEach(buildOptionsForMetadata);

                [domains, ranges].forEach(function (options, i) {
                    var active = $scope.axes[i].active;
                    $scope.axes[i].options = options;
                    if (!active || !active.key) {
                        $scope.axes[i].active =
                            options[0] || AXIS_DEFAULTS[i];
                    }
                });

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

                panZoomStack.push({
                    origin: origin,
                    dimensions: dimensions
                });
            }

            $scope.axes = [ {}, {} ];
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
                                mousePosition,
                                domainOffset
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
                    return panZoomStack.length > 1;
                },
                stepBackPanZoom: function () {
                    if (panZoomStack.length > 1) {
                        panZoomStack.pop();
                        updateDrawingBounds();
                    }
                },
                unzoom: function () {
                    panZoomStack = [panZoomStack[0]];
                    updateDrawingBounds();
                }

            };
        }

        return PlotController;
    }
);