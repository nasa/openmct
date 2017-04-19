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

define(
    [],
    function () {

        /**
         * Supports mode-specific time conductor behavior.
         *
         * @constructor
         * @memberof platform.features.conductor
         * @param {TimeConductorMetadata} metadata
         */
        function TimeConductorMode(metadata, conductor) {
            this.conductor = conductor;

            this.mdata = metadata;
            this.changeTimeSystem = this.changeTimeSystem.bind(this);

            var timeSystem = this.conductor.timeSystem();

            //Set the time system initially
            if (timeSystem) {
                this.changeTimeSystem(timeSystem);
            }

            //Listen for subsequent changes to time system
            conductor.on('timeSystem', this.changeTimeSystem);

            this.availableSystems = conductor.availableTimeSystems();
        }

        /**
         * Get or set the currently selected time system
         * @param timeSystem
         * @returns {TimeSystem} the currently selected time system
         */
        TimeConductorMode.prototype.changeTimeSystem = function (key) {
            var timeSystem = this.conductor.getTimeSystem(key);
            // On time system change, apply default deltas
            var defaults = timeSystem.defaults() || {
                    bounds: {
                        start: 0,
                        end: 0
                    },
                    deltas: {
                        start: 0,
                        end: 0
                    }
                };

            this.conductor.bounds(defaults.bounds);
            this.deltas(defaults.deltas);
        };

        /**
         * @returns {ModeMetadata}
         */
        TimeConductorMode.prototype.metadata = function () {
            return this.mdata;
        };

        TimeConductorMode.prototype.availableTimeSystems = function () {
            return this.availableSystems;
        };

        /**
         * Get or set tick source. Setting tick source will also start
         * listening to it and unlisten from any existing tick source
         * @param tickSource
         * @returns {TickSource}
         */
        TimeConductorMode.prototype.tickSource = function (tickSource) {
            if (arguments.length > 0) {
                var timeSystem = this.conductor.getTimeSystem(this.conductor.timeSystem());
                var defaults = timeSystem.defaults() || {
                        bounds: {
                            start: 0,
                            end: 0
                        },
                        deltas: {
                            start: 0,
                            end: 0
                        }
                    };

                this.conductor.tickSource(tickSource, defaults.deltas);
            }
            return this.conductor.tickSource();
        };

        /**
         * @private
         */
        TimeConductorMode.prototype.destroy = function () {
            this.conductor.off('timeSystem', this.changeTimeSystem);
        };

        /**
         * Get or set the current value for the deltas used by this time system.
         * On change, the new deltas will be used to calculate and set the
         * bounds on the time conductor.
         * @param deltas
         * @returns {TimeSystemDeltas}
         */
        TimeConductorMode.prototype.deltas = function (deltas) {
            if (arguments.length !== 0) {
                var bounds = this.calculateBoundsFromDeltas(deltas);
                this.conductor.clockOffsets(deltas);

                if (this.metadata().key !== 'fixed') {
                    this.conductor.bounds(bounds);
                }
            }
            return this.conductor.clockOffsets();
        };

        /**
         * @param deltas
         * @returns {TimeConductorBounds}
         */
        TimeConductorMode.prototype.calculateBoundsFromDeltas = function (deltas) {
            var oldEnd = this.conductor.bounds().end;
            var offsets = this.conductor.clockOffsets();

            if (offsets && offsets.end !== undefined) {
                //Calculate the previous raw end value (without delta)
                oldEnd = oldEnd - offsets.end;
            }

            var bounds = {
                start: oldEnd - deltas.start,
                end: oldEnd + deltas.end
            };
            return bounds;
        };

        /**
         * @typedef {Object} ZoomLevel
         * @property {TimeConductorBounds} bounds The calculated bounds based on the zoom level
         * @property {TimeConductorDeltas} deltas The calculated deltas based on the zoom level
         */
        /**
         * Calculates bounds and deltas based on provided timeSpan. Collectively
         * the bounds and deltas will constitute the new zoom level.
         * @param {number} timeSpan time duration in ms.
         * @return {ZoomLevel} The new zoom bounds and delta calculated for the provided time span
         */
        TimeConductorMode.prototype.calculateZoom = function (timeSpan) {
            var zoom = {};
            var offsets;

            // If a tick source is defined, then the concept of 'now' is
            // important. Calculate zoom based on 'now'.
            if (this.conductor.follow()) {
                offsets = this.conductor.clockOffsets();
                zoom.deltas = {
                    start: timeSpan,
                    end: offsets.end
                };
                zoom.bounds = this.calculateBoundsFromDeltas(zoom.deltas);
            } else {
                var bounds = this.conductor.bounds();
                var center = bounds.start + ((bounds.end - bounds.start)) / 2;
                bounds.start = center - timeSpan / 2;
                bounds.end = center + timeSpan / 2;
                zoom.bounds = bounds;
            }

            return zoom;
        };

        return TimeConductorMode;
    }
);
