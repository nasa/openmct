/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(['EventEmitter'], function (EventEmitter) {

    var tick;

    /**
     * The public API for setting and querying time conductor state. The
     * time conductor is the means by which the temporal bounds of a view
     * are controlled. Time-sensitive views will typically respond to
     * changes to bounds or other properties of the time conductor and
     * update the data displayed based on the time conductor state.
     *
     * The TimeConductor extends the EventEmitter class. A number of events are
     * fired when properties of the time conductor change, which are
     * documented below.
     * @interface
     * @memberof module:openmct
     */
    function TimeAPI() {
        EventEmitter.call(this);

        //The Time System
        this.system = undefined;
        //The Time Of Interest
        this.toi = undefined;

        this.boundsVal = {
            start: undefined,
            end: undefined
        };

        this.timeSystems = new Map();
        this.clocks = new Map();
        this.activeClock = undefined;
        this.offsets = undefined;

        /**
         * Tick is not exposed via public API, even @privately to avoid misuse.
         */

        tick = function (timestamp) {
            var newBounds = {
                start: timestamp + this.offsets.start,
                end: timestamp + this.offsets.end
            };

            this.boundsVal = newBounds;
            this.emit('bounds', this.boundsVal, true);

            // If a bounds change results in a TOI outside of the current
            // bounds, unset it
            if (this.toi < newBounds.start || this.toi > newBounds.end) {
                this.timeOfInterest(undefined);
            }
        }.bind(this);

    }

    TimeAPI.prototype = Object.create(EventEmitter.prototype);

    TimeAPI.prototype.addTimeSystem = function (timeSystem) {
        this.timeSystems.set(timeSystem.key, timeSystem);
    };

    TimeAPI.prototype.getAllTimeSystems = function () {
        return Array.from(this.timeSystems.values());
    };

    TimeAPI.prototype.addClock = function (clock) {
        this.clocks.set(clock.key, clock);
    };

    TimeAPI.prototype.getAllClocks = function () {
        return Array.from(this.clocks.values());
    };

    /**
     * Validate the given bounds. This can be used for pre-validation of
     * bounds, for example by views validating user inputs.
     * @param bounds The start and end time of the conductor.
     * @returns {string | true} A validation error, or true if valid
     * @memberof module:openmct.TimeAPI#
     * @method validateBounds
     */
    TimeAPI.prototype.validateBounds = function (bounds) {
        if ((bounds.start === undefined) ||
            (bounds.end === undefined) ||
            isNaN(bounds.start) ||
            isNaN(bounds.end)
        ) {
            return "Start and end must be specified as integer values";
        } else if (bounds.start > bounds.end) {
            return "Specified start date exceeds end bound";
        }
        return true;
    };

    /**
     * Validate the given offsets. This can be used for pre-validation of
     * offsetse, for example by views validating user inputs.
     * @param offsets The start and end offsets from a 'now' value.
     * @returns {string | true} A validation error, or true if valid
     * @memberof module:openmct.TimeAPI#
     * @method validateBounds
     */
    TimeAPI.prototype.validateOffsets = function (offsets) {
        if ((offsets.start === undefined) ||
            (offsets.end === undefined) ||
            isNaN(offsets.start) ||
            isNaN(offsets.end)
        ) {
            return "Start and end offsets must be specified as integer values";
        } else if (offsets.start >= 0) {
            return "Specified start offset must less than 0";
        } else if (offsets.end < 0) {
            return "Specified end offset must greater than or equal to 0";
        }
        return true;
    };

    /**
     * @typedef {Object} TimeConductorBounds
     * @property {number} start The start time displayed by the time conductor in ms since epoch. Epoch determined by current time system
     * @property {number} end The end time displayed by the time conductor in ms since epoch.
     * @memberof module:openmct.TimeAPI~
     */

    /**
     * Get or set the start and end time of the time conductor. Basic validation
     * of bounds is performed.
     *
     * @param {module:openmct.TimeAPI~TimeConductorBounds} newBounds
     * @throws {Error} Validation error
     * @fires module:openmct.TimeAPI~bounds
     * @returns {module:openmct.TimeAPI~TimeConductorBounds}
     * @memberof module:openmct.TimeAPI#
     * @method bounds
     */
    TimeAPI.prototype.bounds = function (newBounds) {
        if (arguments.length > 0) {
            var validationResult = this.validateBounds(newBounds);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }
            //Create a copy to avoid direct mutation of conductor bounds
            this.boundsVal = JSON.parse(JSON.stringify(newBounds));
            /**
             * The start time, end time, or both have been updated.
             * @event bounds
             * @memberof module:openmct.TimeAPI~
             * @property {TimeConductorBounds} bounds The newly updated bounds
             * @property {boolean} [tick] `true` if the bounds update was due to
             * a "tick" event (ie. was an automatic update), false otherwise.
             */
            this.emit('bounds', this.boundsVal, false);

            // If a bounds change results in a TOI outside of the current
            // bounds, unset it
            if (this.toi < newBounds.start || this.toi > newBounds.end) {
                this.timeOfInterest(undefined);
            }
        }
        //Return a copy to prevent direct mutation of time conductor bounds.
        return JSON.parse(JSON.stringify(this.boundsVal));
    };

    /**
     * Get or set the time system of the TimeAPI. Time systems determine
     * units, epoch, and other aspects of time representation. When changing
     * the time system in use, new valid bounds must also be provided.
     * @param {TimeSystem | string} timeSystem
     * @param {module:openmct.TimeAPI~TimeConductorBounds} bounds
     * @fires module:openmct.TimeAPI~timeSystem
     * @returns {TimeSystem} The currently applied time system
     * @memberof module:openmct.TimeAPI#
     * @method timeSystem
     */
    TimeAPI.prototype.timeSystem = function (timeSystemOrKey, bounds) {
        if (arguments.length >= 2) {
            var timeSystem;

            if (timeSystemOrKey === undefined) {
                throw "Please provide a time system";
            }

            if (typeof timeSystemOrKey === 'string'){
                timeSystem = this.timeSystems.get(timeSystemOrKey);

                if (timeSystem === undefined){
                    throw "Unknown time system " + timeSystemOrKey + ". Has it been registered with 'addTimeSystem'?";
                }
            } else if (typeof timeSystemOrKey === 'object'){
                timeSystem = timeSystemOrKey;

                if (!this.timeSystems.has(timeSystem.key)){
                    throw "Unknown time system " + timeSystem.key + ". Has it been registered with 'addTimeSystem'?";
                }
            } else {
                throw "Attempt to set invalid time system in Time API. Please provide a previously registered time system object or key"
            }

            this.system = timeSystem;

            /**
             * The time system used by the time
             * conductor has changed. A change in Time System will always be
             * followed by a bounds event specifying new query bounds.
             *
             * @event module:openmct.TimeAPI~timeSystem
             * @property {TimeSystem} The value of the currently applied
             * Time System
             * */
            this.emit('timeSystem', this.system);
            this.bounds(bounds);

        } else if (arguments.length === 1) {
            throw new Error('Must set bounds when changing time system');
        }

        return this.system;
    };

    /**
     * Get or set the Time of Interest. The Time of Interest is the temporal
     * focus of the current view. It can be manipulated by the user from the
     * time conductor or from other views.The time of interest can
     * effectively be unset by assigning a value of 'undefined'.
     * @fires module:openmct.TimeAPI~timeOfInterest
     * @param newTOI
     * @returns {number} the current time of interest
     * @memberof module:openmct.TimeAPI#
     * @method timeOfInterest
     */
    TimeAPI.prototype.timeOfInterest = function (newTOI) {
        if (arguments.length > 0) {
            this.toi = newTOI;
            /**
             * The Time of Interest has moved.
             * @event timeOfInterest
             * @memberof module:openmct.TimeAPI~
             * @property {number} Current time of interest
             */
            this.emit('timeOfInterest', this.toi);
        }
        return this.toi;
    };

    /**
     * Set the active clock. Tick source will be immediately subscribed to
     * and ticking will begin. Offsets from 'now' must also be provided.
     * @param {Clock || string} The clock to activate, or its key
     * @param {ClockOffsets} offsets on each tick these will be used to calculate
     * the start and end bounds. This maintains a sliding time window of a fixed
     * width that automatically updates.
     * @return {Clock} the currently active clock;
     */
    TimeAPI.prototype.clock = function (keyOrClock, offsets) {
        if (arguments.length === 2) {
            var clock;

            if (typeof keyOrClock === 'string') {
                clock = this.clocks.get(keyOrClock);
                if (clock === undefined) {
                    throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
                }
            } else if (typeof keyOrClock === 'object') {
                clock = keyOrClock;
                if (!clocks.has(clock.key)){
                    throw "Unknown clock '" + keyOrClock.key + "'. Has it been registered with 'addClock'?";
                }
            }

            var previousClock = this.activeClock;
            if (previousClock !== undefined) {
                previousClock.off("tick", tick);
            }

            this.activeClock = clock;

            if (this.activeClock !== undefined) {
                this.offsets = offsets;
                this.activeClock.on("tick", tick);
            }

            this.emit("clock", this.activeClock);

        } else if (arguments.length === 1){
            throw "When setting the clock, clock offsets must also be provided"
        }

        return this.activeClock;
    };

    TimeAPI.prototype.clockOffsets = function (offsets) {
        if (arguments.length > 0) {

            var validationResult = this.validateOffsets(offsets);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }

            this.offsets = offsets;

            var currentValue = this.activeClock.currentValue();
            var newBounds = {
                start: currentValue + offsets.start,
                end: currentValue + offsets.end
            };

            this.bounds(newBounds);

            this.emit("clockOffsets", offsets);
        }
        return this.offsets;
    };

    TimeAPI.prototype.stopClock = function () {
        if (this.activeClock) {
            this.clock(undefined, undefined);
        }
    };

    return TimeAPI;
});
