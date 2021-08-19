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

class IndependentTimeContext extends TimeContext {
    constructor(globalTimeContext, key) {
        super();
        this.key = key;
        this.tick = this.tick.bind(this);

        this.globalTimeContext = globalTimeContext;
        this.globalTimeContext.on('tick', this.tick);
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
                clock = this.globalTimeContext.clocks.get(keyOrClock);
                if (clock === undefined) {
                    throw "Unknown clock '" + keyOrClock + "'. Has it been registered with 'addClock'?";
                }
            } else if (typeof keyOrClock === 'object') {
                clock = keyOrClock;
                if (!this.globalTimeContext.clocks.has(clock.key)) {
                    throw "Unknown clock '" + keyOrClock.key + "'. Has it been registered with 'addClock'?";
                }
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
        if (!this.activeClock) {
            return;
        }

        const newBounds = {
            start: timestamp + this.offsets.start,
            end: timestamp + this.offsets.end
        };

        this.boundsVal = newBounds;
        this.emit('bounds', this.boundsVal, true);
    }
}

export default IndependentTimeContext;
