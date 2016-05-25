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

define( [], function () {

    /**
     * Defines a limit object for a time conductor bounds, ie. start or end values. Holds time and delta values.
     *
     * TODO: Calculation of time from delta. Should probably be done from the 'tick' function at a higher level,
     * which has start and end values in scope to do calculations.
     * @param listener
     * @constructor
     */
    function TimeConductorLimit(listener) {
        this.deltaVal = undefined;
        this.timeVal = undefined;
        this.listener = listener;
    }

    /**
     * Get or set the start value for the bounds. If newVal is provided, will set the start value. May only set delta in
     * RELATIVE mode.
     * @param {Number} [newVal] a time in ms. A negative value describes a time in the past, positive in the future. A
     * start time cannot have a positive delta offset, but an end time can.
     * @param {TimeConductor.EventTypes} [eventType=TimeConductor.EventTypes.EITHER] The type of event (User, System, or
     * Either)
     * @returns {Number} the start date (in milliseconds since some epoch, depending on time system)
     */
    TimeConductorLimit.prototype.delta = function (newVal, eventType) {
        if (arguments.length > 0) {
            this.deltaVal = newVal;
            this.listener.notify(eventType);
        }
        return this.deltaVal;
    };
    /**
     * Get or set the end value for the bounds. If newVal is provided, will set the end value. May only set time in FIXED
     * mode
     * @param {Number} [newVal] A time in ms relative to time system epoch.
     * @param {TimeConductor.EventTypes} [eventType=TimeConductor.EventTypes.EITHER] The type of event (User, System, or Either)
     * @returns {Number} the end date (in milliseconds since some epoch, depending on time system)
     */
    TimeConductorLimit.prototype.time = function (newVal, eventType) {
        if (arguments.length > 0) {
            this.timeVal = newVal;
            this.listener.notify(eventType);
        }
        return this.timeVal;
    };

    return TimeConductorLimit;
});
