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
/*global define,Float32Array*/

define(
    ['./PlotLine', './PlotLineBuffer'],
    function (PlotLine, PlotLineBuffer) {
        'use strict';

        var MAX_POINTS = 86400,
            PADDING_RATIO = 0.10, // Padding percentage for top & bottom
            INITIAL_SIZE = 675; // 1/128 of MAX_POINTS

        /**
         * The PlotPreparer is responsible for handling data sets and
         * preparing them to be rendered. It creates a WebGL-plottable
         * Float32Array for each trace, and tracks the boundaries of the
         * data sets (since this is convenient to do during the same pass).
         * @memberof platform/features/plot
         * @constructor
         * @param {TelemetryHandle} handle the handle to telemetry access
         * @param {string} domain the key to use when looking up domain values
         * @param {string} range the key to use when looking up range values
         * @param {number} fixedDuration maximum plot duration to display
         * @param {number} maxPoints maximum number of points to display
         */
        function PlotUpdater(handle, domain, range, fixedDuration, maxPoints) {
            this.handle = handle;
            this.domain = domain;
            this.range = range;
            this.fixedDuration = fixedDuration;
            this.maxPoints = maxPoints;

            this.ids = [];
            this.lines = {};
            this.buffers = {};
            this.bufferArray = [];

            // Use a default MAX_POINTS if none is provided
            this.maxPoints = maxPoints !== undefined ? maxPoints : MAX_POINTS;
            this.dimensions = [0, 0];
            this.origin = [0, 0];

            // Initially prepare state for these objects.
            // Note that this may be an empty array at this time,
            // so we also need to check during update cycles.
            this.update();
        }

        // Look up a domain object's id (for mapping, below)
        function getId(domainObject) {
            return domainObject.getId();
        }

        // Used in the reduce step of updateExtrema
        function reduceExtrema(a, b) {
            return [ Math.min(a[0], b[0]), Math.max(a[1], b[1]) ];
        }

        // Convert a domain/range extrema to plot dimensions
        function dimensionsOf(extrema) {
            return extrema[1] - extrema[0];
        }

        // Convert a domain/range extrema to a plot origin
        function originOf(extrema) {
            return extrema[0];
        }

        // Check if this set of ids matches the current set of ids
        // (used to detect if line preparation can be skipped)
        PlotUpdater.prototype.idsMatch = function (nextIds) {
            var ids = this.ids;
            return ids.length === nextIds.length &&
                nextIds.every(function (id, index) {
                    return ids[index] === id;
                });
        };

        // Prepare plot lines for this group of telemetry objects
        PlotUpdater.prototype.prepareLines = function (telemetryObjects) {
            var nextIds = telemetryObjects.map(getId),
                next = {},
                self = this;

            // Detect if we already have everything we need prepared
            if (this.idsMatch(nextIds)) {
                // Nothing to prepare, move on
                return;
            }

            // Built up a set of ids. Note that we can only
            // create plot lines after our domain offset has
            // been determined.
            if (this.domainOffset !== undefined) {
                // Update list of ids in use
                this.ids = nextIds;

                // Create buffers for these objects
                this.bufferArray = this.ids.map(function (id) {
                    self.buffers[id] = self.buffers[id] || new PlotLineBuffer(
                        self.domainOffset,
                        INITIAL_SIZE,
                        self.maxPoints
                    );
                    next[id] =
                        self.lines[id] || new PlotLine(self.buffers[id]);
                    return self.buffers[id];
                });
            }

            // If there are no more lines, clear the domain offset
            if (Object.keys(next).length < 1) {
                this.domainOffset = undefined;
            }

            // Update to the current set of lines
            this.lines = next;
        };

        // Initialize the domain offset, based on these observed values
        PlotUpdater.prototype.initializeDomainOffset = function (values) {
            this.domainOffset =
                ((this.domainOffset === undefined) && (values.length > 0)) ?
                        (values.reduce(function (a, b) {
                            return (a || 0) + (b || 0);
                        }, 0) / values.length) :
                        this.domainOffset;
        };

        // Expand range slightly so points near edges are visible
        PlotUpdater.prototype.expandRange = function () {
            var padding = PADDING_RATIO * this.dimensions[1],
                top;
            padding = Math.max(padding, 1.0);
            top = Math.ceil(this.origin[1] + this.dimensions[1] + padding / 2);
            this.origin[1] = Math.floor(this.origin[1] - padding / 2);
            this.dimensions[1] = top - this.origin[1];
        };

        // Update dimensions and origin based on extrema of plots
        PlotUpdater.prototype.updateBounds = function () {
            var bufferArray = this.bufferArray.filter(function (lineBuffer) {
                    return lineBuffer.getLength() > 0; // Ignore empty lines
                }),
                priorDomainOrigin = this.origin[0],
                priorDomainDimensions = this.dimensions[0];

            if (bufferArray.length > 0) {
                this.domainExtrema = bufferArray.map(function (lineBuffer) {
                    return lineBuffer.getDomainExtrema();
                }).reduce(reduceExtrema);

                this.rangeExtrema = bufferArray.map(function (lineBuffer) {
                    return lineBuffer.getRangeExtrema();
                }).reduce(reduceExtrema);

                // Calculate best-fit dimensions
                this.dimensions = [ this.domainExtrema, this.rangeExtrema ]
                    .map(dimensionsOf);
                this.origin = [ this.domainExtrema, this.rangeExtrema ]
                    .map(originOf);

                // Enforce some minimum visible area
                this.expandRange();

                // Suppress domain changes when pinned
                if (this.hasSpecificDomainBounds) {
                    this.origin[0] = priorDomainOrigin;
                    this.dimensions[0] = priorDomainDimensions;
                    if (this.following) {
                        this.origin[0] = Math.max(
                            this.domainExtrema[1] - this.dimensions[0],
                            this.origin[0]
                        );
                    }
                }

                // ...then enforce a fixed duration if needed
                if (this.fixedDuration !== undefined) {
                    this.origin[0] = this.origin[0] + this.dimensions[0] -
                        this.fixedDuration;
                    this.dimensions[0] = this.fixedDuration;
                }
            }
        };

        // Add latest data for this domain object
        PlotUpdater.prototype.addPointFor = function (domainObject) {
            var line = this.lines[domainObject.getId()];
            if (line) {
                line.addPoint(
                    this.handle.getDomainValue(domainObject, this.domain),
                    this.handle.getRangeValue(domainObject, this.range)
                );
            }
        };

        /**
         * Update with latest data.
         */
        PlotUpdater.prototype.update = function update() {
            var objects = this.handle.getTelemetryObjects(),
                self = this;

            // Initialize domain offset if necessary
            if (this.domainOffset === undefined) {
                this.initializeDomainOffset(objects.map(function (obj) {
                    return self.handle.getDomainValue(obj, self.domain);
                }).filter(function (value) {
                    return typeof value === 'number';
                }));
            }

            // Make sure lines are available
            this.prepareLines(objects);

            // Add new data
            objects.forEach(function (domainObject, index) {
                self.addPointFor(domainObject, index);
            });

            // Then, update extrema
            this.updateBounds();
        };

        /**
         * Get the dimensions which bound all data in the provided
         * data sets. This is given as a two-element array where the
         * first element is domain, and second is range.
         * @returns {number[]} the dimensions which bound this data set
         */
        PlotUpdater.prototype.getDimensions = function () {
            return this.dimensions;
        };

        /**
         * Get the origin of this data set's boundary.
         * This is given as a two-element array where the
         * first element is domain, and second is range.
         * The domain value here is not adjusted by the domain offset.
         * @returns {number[]} the origin of this data set's boundary
         */
        PlotUpdater.prototype.getOrigin = function () {
            return this.origin;
        };

        /**
         * Get the domain offset; this offset will have been subtracted
         * from all domain values in all buffers returned by this
         * preparer, in order to minimize loss-of-precision due to
         * conversion to the 32-bit float format needed by WebGL.
         * @returns {number} the domain offset
         * @memberof platform/features/plot.PlotUpdater#
         */
        PlotUpdater.prototype.getDomainOffset = function () {
            return this.domainOffset;
        };

        /**
         * Get all renderable buffers for this data set. This will
         * be returned as an array which can be correlated back to
         * the provided telemetry data objects (from the constructor
         * call) by index.
         *
         * Internally, these are flattened; each buffer contains a
         * sequence of alternating domain and range values.
         *
         * All domain values in all buffers will have been adjusted
         * from their original values by subtraction of the domain
         * offset; this minimizes loss-of-precision resulting from
         * the conversion to 32-bit floats, which may otherwise
         * cause aliasing artifacts (particularly for timestamps)
         *
         * @returns {Float32Array[]} the buffers for these traces
         * @memberof platform/features/plot.PlotUpdater#
         */
        PlotUpdater.prototype.getLineBuffers = function () {
            return this.bufferArray;
        };

        /**
         * Set the start and end boundaries (usually time) for the
         * domain axis of this updater.
         */
        PlotUpdater.prototype.setDomainBounds = function (start, end) {
            this.fixedDuration = end - start;
            this.origin[0] = start;
            this.dimensions[0] = this.fixedDuration;

            // Suppress follow behavior if we have windowed in on the past
            this.hasSpecificDomainBounds = true;
            this.following =
                !this.domainExtrema || (end >= this.domainExtrema[1]);
        };

        /**
         * Fill in historical data.
         */
        PlotUpdater.prototype.addHistorical = function (domainObject, series) {
            var count = series ? series.getPointCount() : 0,
                line;

            // Nothing to do if it's an empty series
            if (count < 1) {
                return;
            }

            // Initialize domain offset if necessary
            if (this.domainOffset === undefined) {
                this.initializeDomainOffset([
                    series.getDomainValue(0, this.domain),
                    series.getDomainValue(count - 1, this.domain)
                ]);
            }

            // Make sure lines are available
            this.prepareLines(this.handle.getTelemetryObjects());

            // Look up the line for this domain object
            line = this.lines[domainObject.getId()];

            // ...and put the data into it.
            if (line) {
                line.addSeries(series, this.domain, this.range);
            }

            // Update extrema
            this.updateBounds();
        };

        return PlotUpdater;

    }
);

