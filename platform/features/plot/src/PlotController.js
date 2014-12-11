/*global define*/

/**
 * Module defining PlotController. Created by vwoeltje on 11/12/14.
 */
define(
    [
        "./elements/PlotPreparer",
        "./elements/PlotPalette",
        "./elements/PlotPanZoomStack",
        "./elements/PlotPosition",
        "./elements/PlotTickGenerator",
        "./elements/PlotFormatter",
        "./elements/PlotAxis",
        "./modes/PlotModeOptions"
    ],
    function (
        PlotPreparer,
        PlotPalette,
        PlotPanZoomStack,
        PlotPosition,
        PlotTickGenerator,
        PlotFormatter,
        PlotAxis,
        PlotModeOptions
    ) {
        "use strict";

        var AXIS_DEFAULTS = [
                { "name": "Time" },
                { "name": "Value" }
            ],
            DOMAIN_TICKS = 5,
            RANGE_TICKS = 7;

        /**
         * The PlotController is responsible for any computation/logic
         * associated with displaying the plot view. Specifically, these
         * responsibilities include:
         *
         * * Describing axes and labeling.
         * * Handling user interactions.
         * * Deciding what needs to be drawn in the chart area.
         *
         * @constructor
         */
        function PlotController($scope) {
            var mousePosition,
                marqueeStart,
                panZoomStack = new PlotPanZoomStack([], []),
                formatter = new PlotFormatter(),
                modeOptions,
                domainOffset;

            // Utility, for map/forEach loops. Index 0 is domain,
            // index 1 is range.
            function formatValue(v, i) {
                return (i ?
                        formatter.formatRangeValue :
                        formatter.formatDomainValue)(v);
            }

            // Converts from pixel coordinates to domain-range,
            // to interpret mouse gestures.
            function mousePositionToDomainRange(mousePosition) {
                return new PlotPosition(
                    mousePosition.x,
                    mousePosition.y,
                    mousePosition.width,
                    mousePosition.height,
                    panZoomStack
                ).getPosition();
            }

            // Utility function to get the mouse position (in x,y
            // pixel coordinates in the canvas area) from a mouse
            // event object.
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

            // Convert a domain-range position to a displayable
            // position. This will subtract the domain offset, which
            // is used to bias domain values to minimize loss-of-precision
            // associated with conversion to a 32-bit floating point
            // format (which is needed in the chart area itself, by WebGL.)
            function toDisplayable(position) {
                return [ position[0] - domainOffset, position[1] ];
            }

            // Update the drawable marquee area to reflect current
            // mouse position (or don't show it at all, if no marquee
            // zoom is in progress)
            function updateMarqueeBox() {
                // Express this as a box in the draw object, which
                // is passed to an mct-chart in the template for rendering.
                $scope.draw.boxes = marqueeStart ?
                        [{
                            start: toDisplayable(mousePositionToDomainRange(marqueeStart)),
                            end: toDisplayable(mousePositionToDomainRange(mousePosition)),
                            color: [1, 1, 1, 0.5 ]
                        }] : undefined;
            }

            // Update the bounds (origin and dimensions) of the drawing area.
            function updateDrawingBounds() {
                var panZoom = panZoomStack.getPanZoom();

                // Communicate pan-zoom state from stack to the draw object
                // which is passed to mct-chart in the template.
                $scope.draw.dimensions = panZoom.dimensions;
                $scope.draw.origin = [
                    panZoom.origin[0] - domainOffset,
                    panZoom.origin[1]
                ];
            }

            // Update tick marks in scope.
            function updateTicks() {
                var tickGenerator = new PlotTickGenerator(panZoomStack, formatter);

                $scope.domainTicks =
                    tickGenerator.generateDomainTicks(DOMAIN_TICKS);
                $scope.rangeTicks =
                    tickGenerator.generateRangeTicks(RANGE_TICKS);
            }

            // Populate the scope with axis information (specifically, options
            // available for each axis.)
            function setupAxes(metadatas) {
                $scope.axes = [
                    new PlotAxis("domain", metadatas, AXIS_DEFAULTS[0]),
                    new PlotAxis("range", metadatas, AXIS_DEFAULTS[1])
                ];
            }

            // Respond to newly-available telemetry data; update the
            // drawing area accordingly.
            function plotTelemetry() {
                var prepared, datas, telemetry;

                // Get a reference to the TelemetryController
                telemetry = $scope.telemetry;

                // Nothing to plot without TelemetryController
                if (!telemetry) {
                    return;
                }

                // Ensure axes have been initialized (we will want to
                // get the active axis below)
                if (!$scope.axes) {
                    setupAxes(telemetry.getMetadata());
                }

                // Get data sets
                datas = telemetry.getResponse();

                // Prepare data sets for rendering
                prepared = new PlotPreparer(
                    datas,
                    ($scope.axes[0].active || {}).key,
                    ($scope.axes[1].active || {}).key
                );

                // Fit to the boundaries of the data, but don't
                // override any user-initiated pan-zoom changes.
                panZoomStack.setBasePanZoom(
                    prepared.getOrigin(),
                    prepared.getDimensions()
                );

                // Track the domain offset, used to bias domain values
                // to minimize loss of precision when converted to 32-bit
                // floating point values for display.
                domainOffset = prepared.getDomainOffset();

                // Draw the buffers. Select color by index.
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

            // Perform a marquee zoom.
            function marqueeZoom(start, end) {
                // Determine what boundary is described by the marquee,
                // in domain-range values. Use the minima for origin, so that
                // it doesn't matter what direction the user marqueed in.
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

                // Push the new state onto the pan-zoom stack
                panZoomStack.pushPanZoom(origin, dimensions);

                // Make sure tick marks reflect new bounds
                updateTicks();
            }

            function setupModes(telemetryObjects) {
                modeOptions = new PlotModeOptions(telemetryObjects);
            }

            $scope.$watch("telemetry.getTelemetryObjects()", setupModes);
            $scope.$watch("telemetry.getMetadata()", setupAxes);
            $scope.$on("telemetryUpdate", plotTelemetry);
            $scope.draw = {};

            return {
                /**
                 * Get the color (as a style-friendly string) to use
                 * for plotting the trace at the specified index.
                 * @param {number} index the index of the trace
                 * @returns {string} the color, in #RRGGBB form
                 */
                getColor: function (index) {
                    return PlotPalette.getStringColor(index);
                },
                /**
                 * Get the coordinates (as displayable text) for the
                 * current mouse position.
                 * @returns {string[]} the displayable domain and range
                 *          coordinates over which the mouse is hovered
                 */
                getHoverCoordinates: function () {
                    return mousePosition ?
                            mousePositionToDomainRange(
                                mousePosition
                            ).map(formatValue) : [];
                },
                /**
                 * Handle mouse movement over the chart area.
                 * @param $event the mouse event
                 */
                hover: function ($event) {
                    mousePosition = toMousePosition($event);
                    if (marqueeStart) {
                        updateMarqueeBox();
                    }
                },
                /**
                 * Initiate a marquee zoom action.
                 * @param $event the mouse event
                 */
                startMarquee: function ($event) {
                    mousePosition = marqueeStart = toMousePosition($event);
                    updateMarqueeBox();
                },
                /**
                 * Complete a marquee zoom action.
                 * @param $event the mouse event
                 */
                endMarquee: function ($event) {
                    mousePosition = toMousePosition($event);
                    if (marqueeStart) {
                        marqueeZoom(marqueeStart, mousePosition);
                        marqueeStart = undefined;
                        updateMarqueeBox();
                        updateDrawingBounds();
                    }
                },
                /**
                 * Check if the plot is zoomed or panned out
                 * of its default state (to determine whether back/unzoom
                 * controls should be shown)
                 * @returns {boolean} true if not in default state
                 */
                isZoomed: function () {
                    return panZoomStack.getDepth() > 1;
                },
                /**
                 * Undo the most recent pan/zoom change and restore
                 * the prior state.
                 */
                stepBackPanZoom: function () {
                    panZoomStack.popPanZoom();
                    updateDrawingBounds();
                },
                /**
                 * Undo all pan/zoom changes and restore the initial state.
                 */
                unzoom: function () {
                    panZoomStack.clearPanZoom();
                    updateDrawingBounds();
                },
                getModeOptions: function () {
                    return modeOptions && modeOptions.getModeOptions();
                },
                getMode: function () {
                    return modeOptions && modeOptions.getModeOptions()[0];
                },
                setMode: function (mode) {
                    console.log(mode);
                }

            };
        }

        return PlotController;
    }
);