/*global define*/

define(
    ['elements/PlotPosition', 'elements/PlotFormatter', 'elements/PlotTickGenerator'],
    function (PlotPosition, PlotFormatter, PlotTickGenerator) {
        "use strict";

        var AXIS_DEFAULTS = [
                { "name": "Time" },
                { "name": "Value" }
            ],
            DOMAIN_TICKS = 5,
            RANGE_TICKS = 7;

        function SubPlot(telemetryObjects, panZoomStack) {
            var draw = {},
                rangeTicks = [],
                domainTicks = [],
                formatter = new PlotFormatter(),
                domainOffset,
                mousePosition,
                marqueeStart;

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
                draw.boxes = marqueeStart ?
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
                draw.dimensions = panZoom.dimensions;
                draw.origin = [
                    panZoom.origin[0] - domainOffset,
                    panZoom.origin[1]
                ];
            }

            // Update tick marks in scope.
            function updateTicks() {
                var tickGenerator = new PlotTickGenerator(panZoomStack, formatter);

                domainTicks =
                    tickGenerator.generateDomainTicks(DOMAIN_TICKS);
                rangeTicks =
                    tickGenerator.generateRangeTicks(RANGE_TICKS);
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

            return {
                getTelemetryObjects: function () {
                    return telemetryObjects;
                },
                getDomainTicks: function () {
                    return domainTicks;
                },
                getRangeTicks: function () {
                    return rangeTicks;
                },
                getDrawingObject: function () {
                    return draw;
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
                 * Update the drawing bounds, marquee box, and
                 * tick marks for this subplot.
                 */
                update: function () {
                    updateDrawingBounds();
                    updateMarqueeBox();
                    updateTicks();
                }
            };
        }

        return SubPlot;

    }
);