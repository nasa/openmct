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

define(['EventEmitter'], function (EventEmitter) {

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
     * @constructor
     */
    function TimeConductor() {
        EventEmitter.call(this);

        //The Time System
        this.system = undefined;
        //The Time Of Interest
        this.toi = undefined;

        this.boundsVal = {
            start: undefined,
            end: undefined
        };

        //Default to fixed mode
        this.followMode = false;
    }

    TimeConductor.prototype = Object.create(EventEmitter.prototype);

    /**
     * Validate the given bounds. This can be used for pre-validation of
     * bounds, for example by views validating user inputs.
     * @param bounds The start and end time of the conductor.
     * @returns {string | true} A validation error, or true if valid
     */
    TimeConductor.prototype.validateBounds = function (bounds) {
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
     * Get or set the follow mode of the time conductor. In follow mode the
     * time conductor ticks, regularly updating the bounds from a timing
     * source appropriate to the selected time system and mode of the time
     * conductor.
     * @fires TimeConductor#follow
     * @param {boolean} followMode
     * @returns {boolean}
     */
    TimeConductor.prototype.follow = function (followMode) {
        if (arguments.length > 0) {
            this.followMode = followMode;
            /**
             * @event TimeConductor#follow The TimeConductor has toggled
             * into or out of follow mode.
             * @property {boolean} followMode true if follow mode is
             * enabled, otherwise false.
             */
            this.emit('follow', this.followMode);
        }
        return this.followMode;
    };

    /**
     * @typedef {Object} TimeConductorBounds
     * @property {number} start The start time displayed by the time conductor in ms since epoch. Epoch determined by current time system
     * @property {number} end The end time displayed by the time conductor in ms since epoch.
     */
    /**
     * Get or set the start and end time of the time conductor. Basic validation
     * of bounds is performed.
     *
     * @param {TimeConductorBounds} newBounds
     * @throws {Error} Validation error
     * @fires TimeConductor#bounds
     * @returns {TimeConductorBounds}
     */
    TimeConductor.prototype.bounds = function (newBounds) {
        if (arguments.length > 0) {
            var validationResult = this.validateBounds(newBounds);
            if (validationResult !== true) {
                throw new Error(validationResult);
            }
            //Create a copy to avoid direct mutation of conductor bounds
            this.boundsVal = JSON.parse(JSON.stringify(newBounds));
            /**
             * @event TimeConductor#bounds The start time, end time, or
             * both have been updated
             * @property {TimeConductorBounds} bounds
             */
            this.emit('bounds', this.boundsVal);
        }
        //Return a copy to prevent direct mutation of time conductor bounds.
        return JSON.parse(JSON.stringify(this.boundsVal));
    };

    /**
     * Get or set the time system of the TimeConductor. Time systems determine
     * units, epoch, and other aspects of time representation. When changing
     * the time system in use, new valid bounds must also be provided.
     * @param {TimeSystem} newTimeSystem
     * @param {TimeConductorBounds} bounds
     * @fires TimeConductor#timeSystem
     * @returns {TimeSystem} The currently applied time system
     */
    TimeConductor.prototype.timeSystem = function (newTimeSystem, bounds) {
        if (arguments.length >= 2) {
            this.system = newTimeSystem;
            /**
             * @event TimeConductor#timeSystem The time system used by the time
             * conductor has changed. A change in Time System will always be
             * followed by a bounds event specifying new query bounds
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
     * time conductor or from other views.
     * @fires TimeConductor#timeOfInterest
     * @param newTOI
     * @returns {number} the current time of interest
     */
    TimeConductor.prototype.timeOfInterest = function (newTOI) {
        if (arguments.length > 0) {
            this.toi = newTOI;
            /**
             * @event TimeConductor#timeOfInterest The Time of Interest has moved.
             * @property {number} Current time of interest
             */
            this.emit('timeOfInterest', this.toi);
        }
        return this.toi;
    };

    return TimeConductor;
});
