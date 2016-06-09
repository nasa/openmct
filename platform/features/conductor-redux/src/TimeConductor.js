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

define([
    "EventEmitter",
    "./UTCTimeSystem",
    "./modes/RelativeMode",
    "./modes/FixedMode"
], function (EventEmitter, UTCTimeSystem, RelativeMode, FixedMode) {

    /**
     * A class for setting and querying time conductor state.
     *
     * @event TimeConductor:refresh The time conductor has changed, and its values should be re-queried
     * @event TimeConductor:bounds The start time, end time, or both have been updated
     * @event TimeConductor:timeOfInterest The Time of Interest has moved.
     * @constructor
     */
    function TimeConductor() {
        EventEmitter.call(this);

        //The Time System
        this.system = new UTCTimeSystem();
        //The Time Of Interest
        this.toi = undefined;

        this.boundsVal = {
            start: undefined,
            end: undefined
        };

        //Default to fixed mode
        this.modeVal = new FixedMode();
    }

    TimeConductor.prototype = Object.create(EventEmitter.prototype);

    /**
     * Validate the given bounds. This can be used for pre-validation of
     * bounds, for example by views validating user inputs.
     * @param bounds The start and end time of the conductor.
     * @returns {string | true} A validation error, or true if valid
     */
    TimeConductor.prototype.validateBounds = function (bounds) {
        if (!bounds.start ||
            !bounds.end ||
            isNaN(bounds.start) ||
            isNaN(bounds.end)
        ) {
            return "Start and end must be specified as integer values";
        } else if (bounds.start > bounds.end){
            return "Specified start date exceeds end bound";
        }
        return true;
    };

    function throwOnError(validationResult) {
        if (validationResult !== true) {
            throw validationResult;
        }
    }

    /**
     * Set the mode of the time conductor.
     * @param {FixedMode | RealtimeMode} newMode
     * @fires TimeConductor#refresh
     * @returns {FixedMode | RealtimeMode}
     */
    TimeConductor.prototype.mode = function (newMode) {
        if (arguments.length > 0) {
            this.modeVal = newMode;
            this.emit('refresh', this);
            newMode.initialize();
        }
        return this.modeVal;
    };

    /**
     * @typedef {Object} TimeConductorBounds
     * @property {number} start The start time displayed by the time conductor in ms since epoch. Epoch determined by current time system
     * @property {number} end The end time displayed by the time conductor in ms since epoch.
     */
    /**
     * Set the start and end time of the time conductor. Basic validation of bounds is performed.
     *
     * @param {TimeConductorBounds} newBounds
     * @param {TimeConductorBounds} should this change trigger a refresh?
     * @throws {string} Validation error
     * @fires TimeConductor#bounds
     * @returns {TimeConductorBounds}
     */
    TimeConductor.prototype.bounds = function (newBounds, refresh) {
        if (arguments.length > 0) {
            throwOnError(this.validateBounds(newBounds));
            this.boundsVal = newBounds;
            this.emit('bounds', this.boundsVal);
            if (refresh) {
                this.emit('refresh');
            }
        }
        return this.boundsVal;
    };

    /**
     * Set the time system of the TimeConductor. Time systems determine units, epoch, and other aspects of time representation.
     * @param newTimeSystem
     * @fires TimeConductor#refresh
     * @returns {TimeSystem} The currently applied time system
     */
    TimeConductor.prototype.timeSystem = function (newTimeSystem) {
        if (arguments.length > 0) {
            this.system = newTimeSystem;
            this.emit('refresh', this);
        }
        return this.system;
    };

    /**
     * The Time of Interest is the temporal focus of the current view. It can be manipulated by the user from the time
     * conductor or from other views.
     * @param newTOI
     * @returns {*}
     */
    TimeConductor.prototype.timeOfInterest = function (newTOI) {
        if (arguments.length > 0) {
            this.toi = newTOI;
            this.emit('toi');
        }
        return this.toi;
    };

    return TimeConductor;
});
