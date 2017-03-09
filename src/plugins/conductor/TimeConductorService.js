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
    [
        'EventEmitter'
    ],
    function (EventEmitter) {

        /**
         * A class representing the state of the time conductor view. This
         * exposes details of the UI that are not represented on the
         * TimeConductor API itself such as modes and deltas.
         *
         * @memberof platform.features.conductor
         * @param conductor
         * @param timeSystems
         * @constructor
         */
        function TimeConductorService(openmct) {

            EventEmitter.call(this);

            this.systems = timeSystems.map(function (timeSystemConstructor) {
                return timeSystemConstructor();
            });

            this.conductor = openmct.conductor;
            this.currentMode = undefined;

        }

        TimeConductorService.prototype = Object.create(EventEmitter.prototype);
        /**
         * @private
         * @param {number} time some value that is valid in the current TimeSystem
         */
        TimeConductorService.prototype.tick = function (time) {
            var deltas = this.deltas();
            var startTime = time;
            var endTime = time;

            if (deltas) {
                startTime = time - deltas.start;
                endTime = time + deltas.end;
            }

            var newBounds = {
                start: startTime,
                end: endTime
            };

            this.conductor.boundsVal = newBounds;
            this.conductor.emit('bounds', true);

            // If a bounds change results in a TOI outside of the current
            // bounds, unset it
            if (this.conductor.toi < newBounds.start || this.conductor.toi > newBounds.end) {
                this.conductor.timeOfInterest(undefined);
            }
        };

        TimeConductorService.prototype.menuOptions = function (options) {
            this.options = options;
        };

        TimeConductorService.prototype.activeTickSource = function (key) {
            if (arguments.length > 0) {
                if (this.activeTickSource !== undefined) {
                    this.activeTickSource.off('tick', this.tick);
                }
                var newTickSource = this.conductor.tickSource[key];
                if (newTickSource) {
                    this.activeTickSource.on('tick', this.tick);
                    this.activeTickSource = newTickSource;
                }
            }
            return this.activeTickSource;
        };

        /**
         * @typedef {object} TimeConductorDeltas
         * @property {number} start Used to set the start bound of the
         * TimeConductor on tick. A positive value that will be subtracted
         * from the value provided by a tick source to determine the start
         * bound.
         * @property {number} end Used to set the end bound of the
         * TimeConductor on tick. A positive value that will be added
         * from the value provided by a tick source to determine the start
         * bound.
         */
        /**
         * Deltas define the offset from the latest time value provided by
         * the current tick source. Deltas are only valid in realtime or LAD
         * modes.
         *
         * Realtime mode:
         *     - start: A time in ms before now which will be used to
         *     determine the 'start' bound on tick
         *     - end: A time in ms after now which will be used to determine
         *     the 'end' bound on tick
         *
         * LAD mode:
         *     - start: A time in ms before the timestamp of the last data
         *     received which will be used to determine the 'start' bound on
         *     tick
         *     - end: A time in ms after the timestamp of the last data received
         *     which will be used to determine the 'end' bound on tick
         * @returns {TimeConductorDeltas} current value of the deltas
         */
        TimeConductorService.prototype.deltas = function () {
            // Get / Set deltas
        };

        /**
         * Availability of modes depends on the time systems and tick
         * sources available. For example, Latest Available Data mode will
         * not be available if there are no time systems and tick sources
         * that support LAD mode.
         * @returns {ModeMetadata[]}
         */
        TimeConductorService.prototype.availableTickSources = function () {
            var conductor = this.conductor;
            //Return all tick sources
            return _.uniq(this.options.map(function (option) {
                return option.tickSource && conductor.tickSources(option.tickSource);
            }.bind(this)));
        };

        TimeConductorService.prototype.availableTimeSystems = function () {
            return Object.values(this.conductor.timeSystems);
        };

        /**
         * An event to indicate that zooming is taking place
         * @event platform.features.conductor.TimeConductorService~zoom
         * @property {ZoomLevel} zoom the new zoom level.
         */
        /**
         * Zoom to given time span. Will fire a zoom event with new zoom
         * bounds. Zoom bounds emitted in this way are considered ephemeral
         * and should be overridden by any time conductor bounds events. Does
         * not set bounds globally.
         * @param {number} zoom A time duration in ms
         * @fires platform.features.conductor.TimeConductorService~zoom
         * @see module:openmct.TimeConductor#bounds
         */
        TimeConductorService.prototype.zoom = function (timeSpan) {
            var zoom = this.currentMode.calculateZoom(timeSpan);
            this.emit("zoom", zoom);
            return zoom;
        };

        return TimeConductorService;
    }
);
