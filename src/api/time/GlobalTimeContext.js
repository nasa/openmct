/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import TimeContext from "./TimeContext";

class GlobalTimeContext extends TimeContext {
    constructor() {
        super();

        //The Time Of Interest
        this.toi = undefined;
    }

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
    bounds(newBounds) {
        if (arguments.length > 0) {
            const validationResult = this.validateBounds(newBounds);
            if (validationResult.valid !== true) {
                throw new Error(validationResult.message);
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
    }

    /**
     * Set the active clock. Tick source will be immediately subscribed to
     * and ticking will begin. Offsets from 'now' must also be provided. A clock
     * can be unset by calling {@link stopClock}.
     *
     * @param {Clock || string} keyOrClock The clock to activate, or its key
     * @param {ClockOffsets} offsets on each tick these will be used to calculate
     * the start and end bounds. This maintains a sliding time window of a fixed
     * width that automatically updates.
     * @fires module:openmct.TimeAPI~clock
     * @return {Clock} the currently active clock;
     */
    clock(keyOrClock, offsets) {
        if (arguments.length === 2) {
            let clock;

            if (typeof keyOrClock === 'string') {
                clock = this.clocks.get(keyOrClock);
                if (clock === undefined) {
                    throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
                }
            } else if (typeof keyOrClock === 'object') {
                clock = keyOrClock;
                if (!this.clocks.has(clock.key)) {
                    throw "Unknown clock '" + keyOrClock.key + "'. Has it been registered with 'addClock'?";
                }
            }

            const previousClock = this.activeClock;
            if (previousClock !== undefined) {
                previousClock.off("tick", this.tick);
            }

            this.activeClock = clock;

            /**
             * The active clock has changed. Clock can be unset by calling {@link stopClock}
             * @event clock
             * @memberof module:openmct.TimeAPI~
             * @property {Clock} clock The newly activated clock, or undefined
             * if the system is no longer following a clock source
             */
            this.emit("clock", this.activeClock);

            if (this.activeClock !== undefined) {
                this.clockOffsets(offsets);
                this.activeClock.on("tick", this.tick);
            }

        } else if (arguments.length === 1) {
            throw "When setting the clock, clock offsets must also be provided";
        }

        return this.activeClock;
    }

    /**
     * Update bounds based on provided time and current offsets
     * @private
     * @param {number} timestamp A time from which bounds will be calculated
     * using current offsets.
     */
    tick(timestamp) {
        const newBounds = {
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
    }

    /**
     * Get or set the Time of Interest. The Time of Interest is a single point
     * in time, and constitutes the temporal focus of application views. It can
     * be manipulated by the user from the time conductor or from other views.
     * The time of interest can effectively be unset by assigning a value of
     * 'undefined'.
     * @fires module:openmct.TimeAPI~timeOfInterest
     * @param newTOI
     * @returns {number} the current time of interest
     * @memberof module:openmct.TimeAPI#
     * @method timeOfInterest
     */
    timeOfInterest(newTOI) {
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
    }
}

export default GlobalTimeContext;
