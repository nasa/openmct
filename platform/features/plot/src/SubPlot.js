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

define(
    [
        './elements/PlotPosition',
        './elements/PlotTickGenerator'
    ],
    function (PlotPosition, PlotTickGenerator) {
        "use strict";

        var DOMAIN_TICKS = 5,
            RANGE_TICKS = 7;

        /**
         * A SubPlot is an individual plot within a Plot View (which
         * may contain multiple plots, specifically when in Stacked
         * plot mode.)
         * @memberof platform/features/plot
         * @constructor
         * @param {DomainObject[]} telemetryObjects the domain objects
         *        which will be plotted in this sub-plot
         * @param {PlotPanZoomStack} panZoomStack the stack of pan-zoom
         *        states which is applicable to this sub-plot
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service; used to convert domain/range values
         *        from telemetry data sets to a human-readable form.
         */
        function SubPlot(telemetryObjects, panZoomStack, telemetryFormatter) {
            // We are used from a template often, so maintain
            // state in local variables to allow for fast look-up,
            // as is normal for controllers.
            var draw = {},
                rangeTicks = [],
                domainTicks = [],
                formatter = telemetryFormatter,
                domainOffset,
                mousePosition,
                marqueeStart,
                panStart,
                panStartBounds,
                subPlotBounds,
                hoverCoordinates,
                isHovering = false;

            // Utility, for map/forEach loops. Index 0 is domain,
            // index 1 is range.
            function formatValue(v, i) {
                return (i ?
                        formatter.formatRangeValue :
                        formatter.formatDomainValue)(v);
            }

            // Utility function for filtering out empty strings.
            function isNonEmpty(v) {
                return typeof v === 'string' && v !== "";
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
                var bounds = subPlotBounds;

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


            // Update the currnet hover coordinates
            function updateHoverCoordinates() {
                hoverCoordinates = mousePosition &&
                        mousePositionToDomainRange(mousePosition)
                            .map(formatValue)
                            .filter(isNonEmpty)
                            .join(", ");
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

            function updatePan() {
                var start, current, delta, nextOrigin;

                // Clear the previous panning pan-zoom state
                panZoomStack.popPanZoom();

                // Calculate what the new resulting pan-zoom should be
                start = mousePositionToDomainRange(panStart);
                current = mousePositionToDomainRange(mousePosition);
                delta = [ current[0] - start[0], current[1] - start[1] ];
                nextOrigin = [
                    panStartBounds.origin[0] - delta[0],
                    panStartBounds.origin[1] - delta[1]
                ];

                // ...and push a new one at the current mouse position
                panZoomStack.pushPanZoom(nextOrigin, panStartBounds.dimensions);
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

                // Proceed with zoom if zoom dimensions are non zeros
                if (!(dimensions[0] === 0 && dimensions[1] === 0)) {
                    // Push the new state onto the pan-zoom stack
                    panZoomStack.pushPanZoom(origin, dimensions);

                    // Make sure tick marks reflect new bounds
                    updateTicks();
                }
            }

            // Start with the right initial drawing bounds,
            // tick marks
            updateDrawingBounds();
            updateTicks();

            return {
                /**
                 * Get the set of domain objects which are being
                 * represented in this sub-plot.
                 * @returns {DomainObject[]} the domain objects which
                 *          will have data plotted in this sub-plot
                 * @memberof platform/features/plot.SubPlot#
                 */
                getTelemetryObjects: function () {
                    return telemetryObjects;
                },
                /**
                 * Get ticks mark information appropriate for using in the
                 * template for this sub-plot's domain axis, as prepared
                 * by the PlotTickGenerator.
                 * @returns {Array} tick marks for the domain axis
                 * @memberof platform/features/plot.SubPlot#
                 */
                getDomainTicks: function () {
                    return domainTicks;
                },
                /**
                 * Get ticks mark information appropriate for using in the
                 * template for this sub-plot's range axis, as prepared
                 * by the PlotTickGenerator.
                 * @returns {Array} tick marks for the range axis
                 * @memberof platform/features/plot.SubPlot#
                 */
                getRangeTicks: function () {
                    return rangeTicks;
                },
                /**
                 * Get the drawing object associated with this sub-plot;
                 * this object will be passed to the mct-chart in which
                 * this sub-plot's lines will be plotted, as its "draw"
                 * attribute, and should have the same internal format
                 * expected by that directive.
                 * @return {object} the drawing object
                 * @memberof platform/features/plot.SubPlot#
                 */
                getDrawingObject: function () {
                    return draw;
                },
                /**
                 * Get the coordinates (as displayable text) for the
                 * current mouse position.
                 * @returns {string[]} the displayable domain and range
                 *          coordinates over which the mouse is hovered
                 * @memberof platform/features/plot.SubPlot#
                 */
                getHoverCoordinates: function () {
                    return hoverCoordinates;
                },
                /**
                 * Handle mouse movement over the chart area.
                 * @param $event the mouse event
                 * @memberof platform/features/plot.SubPlot#
                 */
                hover: function ($event) {
                    isHovering = true;
                    subPlotBounds = $event.target.getBoundingClientRect();
                    mousePosition = toMousePosition($event);
                    updateHoverCoordinates();
                    if (marqueeStart) {
                        updateMarqueeBox();
                    }
                    if (panStart) {
                        updatePan();
                        updateDrawingBounds();
                        updateTicks();
                    }
                },
                /**
                 * Continue a previously-start pan or zoom gesture.
                 * @param $event the mouse event
                 * @memberof platform/features/plot.SubPlot#
                 */
                continueDrag: function ($event) {
                    mousePosition = toMousePosition($event);
                    if (marqueeStart) {
                        updateMarqueeBox();
                    }
                    if (panStart) {
                        updatePan();
                        updateDrawingBounds();
                        updateTicks();
                    }
                },
                /**
                 * Initiate a marquee zoom action.
                 * @param $event the mouse event
                 * @memberof platform/features/plot.SubPlot#
                 */
                startDrag: function ($event) {
                    subPlotBounds = $event.target.getBoundingClientRect();
                    mousePosition = toMousePosition($event);
                    // Treat any modifier key as a pan
                    if ($event.altKey || $event.shiftKey || $event.ctrlKey) {
                        // Start panning
                        panStart = mousePosition;
                        panStartBounds = panZoomStack.getPanZoom();
                        // We're starting a pan, so add this back as a
                        // state on the stack; it will get replaced
                        // during the pan.
                        panZoomStack.pushPanZoom(
                            panStartBounds.origin,
                            panStartBounds.dimensions
                        );
                        $event.preventDefault();
                    } else {
                        // Start marquee zooming
                        marqueeStart = mousePosition;
                        updateMarqueeBox();
                    }
                },
                /**
                 * Complete a marquee zoom action.
                 * @param $event the mouse event
                 * @memberof platform/features/plot.SubPlot#
                 */
                endDrag: function ($event) {
                    mousePosition = toMousePosition($event);
                    subPlotBounds = undefined;
                    if (marqueeStart) {
                        marqueeZoom(marqueeStart, mousePosition);
                        marqueeStart = undefined;
                        updateMarqueeBox();
                        updateDrawingBounds();
                        updateTicks();
                    }
                    if (panStart) {
                        // End panning
                        panStart = undefined;
                        panStartBounds = undefined;
                    }
                },
                /**
                 * Update the drawing bounds, marquee box, and
                 * tick marks for this subplot.
                 * @memberof platform/features/plot.SubPlot#
                 */
                update: function () {
                    updateDrawingBounds();
                    updateMarqueeBox();
                    updateTicks();
                },
                /**
                 * Set the domain offset associated with this sub-plot.
                 * A domain offset is subtracted from all domain
                 * before lines are drawn to avoid artifacts associated
                 * with the use of 32-bit floats when domain values
                 * are often timestamps (due to insufficient precision.)
                 * A SubPlot will be drawing boxes (for marquee zoom) in
                 * the same offset coordinate space, so it needs to know
                 * the value of this to position that marquee box
                 * correctly.
                 * @param {number} value the domain offset
                 * @memberof platform/features/plot.SubPlot#
                 */
                setDomainOffset: function (value) {
                    domainOffset = value;
                },
                /**
                 * When used with no argument, check whether or not the user
                 * is currently hovering over this subplot. When used with
                 * an argument, set that state.
                 * @param {boolean} [state] the new hovering state
                 * @returns {boolean} the hovering state
                 * @memberof platform/features/plot.SubPlot#
                 */
                isHovering: function (state) {
                    if (state !== undefined) {
                        isHovering = state;
                    }
                    return isHovering;
                }
            };
        }

        return SubPlot;

    }
);

