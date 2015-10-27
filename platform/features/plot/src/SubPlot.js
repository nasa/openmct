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
            this.telemetryObjects = telemetryObjects;
            this.domainTicks = [];
            this.rangeTicks = [];
            this.formatter = telemetryFormatter;
            this.draw = {};
            this.hovering = false;
            this.panZoomStack = panZoomStack;

            // Start with the right initial drawing bounds,
            // tick marks
            this.updateDrawingBounds();
            this.updateTicks();
        }

        /**
         * Tests whether this subplot has domain data to show for the current pan/zoom level. Absence of domain data
         * implies that there is no range data displayed either
         * @returns {boolean} true if domain data exists for the current pan/zoom level
         */
        SubPlot.prototype.hasDomainData = function() {
            return this.panZoomStack
                && this.panZoomStack.getDimensions()[0] > 0;
        };

        // Utility function for filtering out empty strings.
        function isNonEmpty(v) {
            return typeof v === 'string' && v !== "";
        }

        // Converts from pixel coordinates to domain-range,
        // to interpret mouse gestures.
        SubPlot.prototype.mousePositionToDomainRange = function (mousePosition) {
            return new PlotPosition(
                mousePosition.x,
                mousePosition.y,
                mousePosition.width,
                mousePosition.height,
                this.panZoomStack
            ).getPosition();
        };

        // Utility function to get the mouse position (in x,y
        // pixel coordinates in the canvas area) from a mouse
        // event object.
        SubPlot.prototype.toMousePosition = function ($event) {
            var bounds = this.subPlotBounds;

            return {
                x: $event.clientX - bounds.left,
                y: $event.clientY - bounds.top,
                width: bounds.width,
                height: bounds.height
            };
        };

        // Convert a domain-range position to a displayable
        // position. This will subtract the domain offset, which
        // is used to bias domain values to minimize loss-of-precision
        // associated with conversion to a 32-bit floating point
        // format (which is needed in the chart area itself, by WebGL.)
        SubPlot.prototype.toDisplayable = function (position) {
            return [ position[0] - this.domainOffset, position[1] ];
        };

        // Update the current hover coordinates
        SubPlot.prototype.updateHoverCoordinates = function () {
            var formatter = this.formatter;

            // Utility, for map/forEach loops. Index 0 is domain,
            // index 1 is range.
            function formatValue(v, i) {
                return i ?
                    formatter.formatRangeValue(v) :
                    formatter.formatDomainValue(v);
            }

            this.hoverCoordinates = this.mousePosition &&
                this.mousePositionToDomainRange(this.mousePosition)
                    .map(formatValue)
                    .filter(isNonEmpty)
                    .join(", ");
        };

        // Update the drawable marquee area to reflect current
        // mouse position (or don't show it at all, if no marquee
        // zoom is in progress)
        SubPlot.prototype.updateMarqueeBox = function () {
            // Express this as a box in the draw object, which
            // is passed to an mct-chart in the template for rendering.
            this.draw.boxes = this.marqueeStart ?
                [{
                    start: this.toDisplayable(
                        this.mousePositionToDomainRange(this.marqueeStart)
                    ),
                    end: this.toDisplayable(
                        this.mousePositionToDomainRange(this.mousePosition)
                    ),
                    color: [1, 1, 1, 0.5 ]
                }] : undefined;
        };

        // Update the bounds (origin and dimensions) of the drawing area.
        SubPlot.prototype.updateDrawingBounds = function () {
            var panZoom = this.panZoomStack.getPanZoom();

            // Communicate pan-zoom state from stack to the draw object
            // which is passed to mct-chart in the template.
            this.draw.dimensions = panZoom.dimensions;
            this.draw.origin = [
                panZoom.origin[0] - this.domainOffset,
                panZoom.origin[1]
            ];
        };

        // Update tick marks in scope.
        SubPlot.prototype.updateTicks = function () {
            var tickGenerator =
                new PlotTickGenerator(this.panZoomStack, this.formatter);

            this.domainTicks =
                tickGenerator.generateDomainTicks(DOMAIN_TICKS);
            this.rangeTicks =
                tickGenerator.generateRangeTicks(RANGE_TICKS);
        };

        SubPlot.prototype.updatePan = function () {
            var start, current, delta, nextOrigin;

            // Clear the previous panning pan-zoom state
            this.panZoomStack.popPanZoom();

            // Calculate what the new resulting pan-zoom should be
            start = this.mousePositionToDomainRange(
                this.panStart,
                this.panZoomStack
            );
            current = this.mousePositionToDomainRange(
                this.mousePosition,
                this.panZoomStack
            );

            delta = [ current[0] - start[0], current[1] - start[1] ];
            nextOrigin = [
                this.panStartBounds.origin[0] - delta[0],
                this.panStartBounds.origin[1] - delta[1]
            ];

            // ...and push a new one at the current mouse position
            this.panZoomStack
                .pushPanZoom(nextOrigin, this.panStartBounds.dimensions);
        };

        /**
         * Get the set of domain objects which are being
         * represented in this sub-plot.
         * @returns {DomainObject[]} the domain objects which
         *          will have data plotted in this sub-plot
         */
        SubPlot.prototype.getTelemetryObjects = function () {
            return this.telemetryObjects;
        };

        /**
         * Get ticks mark information appropriate for using in the
         * template for this sub-plot's domain axis, as prepared
         * by the PlotTickGenerator.
         * @returns {Array} tick marks for the domain axis
         */
        SubPlot.prototype.getDomainTicks = function () {
            return this.domainTicks;
        };

        /**
         * Get ticks mark information appropriate for using in the
         * template for this sub-plot's range axis, as prepared
         * by the PlotTickGenerator.
         * @returns {Array} tick marks for the range axis
         */
        SubPlot.prototype.getRangeTicks = function () {
            return this.rangeTicks;
        };

        /**
         * Get the drawing object associated with this sub-plot;
         * this object will be passed to the mct-chart in which
         * this sub-plot's lines will be plotted, as its "draw"
         * attribute, and should have the same internal format
         * expected by that directive.
         * @return {object} the drawing object
         */
        SubPlot.prototype.getDrawingObject = function () {
            return this.draw;
        };

        /**
         * Get the coordinates (as displayable text) for the
         * current mouse position.
         * @returns {string[]} the displayable domain and range
         *          coordinates over which the mouse is hovered
         */
        SubPlot.prototype.getHoverCoordinates = function () {
            return this.hoverCoordinates;
        };

        /**
         * Handle mouse movement over the chart area.
         * @param $event the mouse event
         * @memberof platform/features/plot.SubPlot#
         */
        SubPlot.prototype.hover = function ($event) {
            this.hovering = true;
            this.subPlotBounds = $event.target.getBoundingClientRect();
            this.mousePosition = this.toMousePosition($event);
            //If there is a domain to display, show hover coordinates, otherwise hover coordinates are meaningless
            if (this.hasDomainData()) {
                this.updateHoverCoordinates();
            }
            if (this.marqueeStart) {
                this.updateMarqueeBox();
            }
            if (this.panStart) {
                this.updatePan();
                this.updateDrawingBounds();
                this.updateTicks();
            }
        };

        /**
         * Continue a previously-start pan or zoom gesture.
         * @param $event the mouse event
         * @memberof platform/features/plot.SubPlot#
         */
        SubPlot.prototype.continueDrag = function ($event) {
            this.mousePosition = this.toMousePosition($event);
            if (this.marqueeStart) {
                this.updateMarqueeBox();
            }
            if (this.panStart) {
                this.updatePan();
                this.updateDrawingBounds();
                this.updateTicks();
            }
        };

        /**
         * Initiate a marquee zoom action.
         * @param $event the mouse event
         */
        SubPlot.prototype.startDrag = function ($event) {
            this.subPlotBounds = $event.target.getBoundingClientRect();
            this.mousePosition = this.toMousePosition($event);
            // Treat any modifier key as a pan
            if ($event.altKey || $event.shiftKey || $event.ctrlKey) {
                // Start panning
                this.panStart = this.mousePosition;
                this.panStartBounds = this.panZoomStack.getPanZoom();
                // We're starting a pan, so add this back as a
                // state on the stack; it will get replaced
                // during the pan.
                this.panZoomStack.pushPanZoom(
                    this.panStartBounds.origin,
                    this.panStartBounds.dimensions
                );
                $event.preventDefault();
            } else {
                // Start marquee zooming
                this.marqueeStart = this.mousePosition;
                this.updateMarqueeBox();
            }
        };

        /**
         * Complete a marquee zoom action.
         * @param $event the mouse event
         */
        SubPlot.prototype.endDrag = function ($event) {
            var self = this;

            // Perform a marquee zoom.
            function marqueeZoom(start, end) {
                // Determine what boundary is described by the marquee,
                // in domain-range values. Use the minima for origin, so that
                // it doesn't matter what direction the user marqueed in.
                var a = self.mousePositionToDomainRange(start),
                    b = self.mousePositionToDomainRange(end),
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
                    self.panZoomStack.pushPanZoom(origin, dimensions);

                    // Make sure tick marks reflect new bounds
                    self.updateTicks();
                }
            }

            this.mousePosition = this.toMousePosition($event);
            this.subPlotBounds = undefined;
            if (this.marqueeStart) {
                marqueeZoom(this.marqueeStart, this.mousePosition);
                this.marqueeStart = undefined;
                this.updateMarqueeBox();
                this.updateDrawingBounds();
                this.updateTicks();
            }
            if (this.panStart) {
                // End panning
                this.panStart = undefined;
                this.panStartBounds = undefined;
            }
        };

        /**
         * Update the drawing bounds, marquee box, and
         * tick marks for this subplot.
         */
        SubPlot.prototype.update = function () {
            this.updateDrawingBounds();
            this.updateMarqueeBox();
            this.updateTicks();
        };

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
         */
        SubPlot.prototype.setDomainOffset = function (value) {
            this.domainOffset = value;
        };

        /**
         * When used with no argument, check whether or not the user
         * is currently hovering over this subplot. When used with
         * an argument, set that state.
         * @param {boolean} [state] the new hovering state
         * @returns {boolean} the hovering state
         */
        SubPlot.prototype.isHovering = function (state) {
            if (state !== undefined) {
                this.hovering = state;
            }
            return this.hovering;
        };

        return SubPlot;

    }
);

