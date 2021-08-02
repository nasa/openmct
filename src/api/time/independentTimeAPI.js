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

import EventEmitter from 'EventEmitter';

class IndependentTimeAPI extends EventEmitter {
    constructor() {
        super();
        this.offsets = {};

        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.observe = this.observe.bind(this);
    }

    /**
     * Get the real time and fixed time span offsets for a given domain object key.
     * @param {key | string} keyString The identifier key of the domain object these bounds are set for
     * @returns {ClockOffsets} value This maintains a sliding time window of a fixed
     * width that automatically updates for both realtime and fixed timespans
     * @method get
     */
    get(keyString) {
        return this.offsets[keyString];
    }
    /**
     * Get or set the real time and fixed time span offsets for a given domain object key.
     * @param {key | string} keyString The identifier key of the domain object these bounds are set for
     * @param {ClockOffsets} value This maintains a sliding time window of a fixed
     * width that automatically updates
     * @param {key | string} clock the real time clock key currently in use
     * @method set
     */
    set(keyString, value, clock) {
        if (keyString === undefined) {
            throw "Please provide a domain object identifier key";
        }

        const validationResult = this.validateOffsets(value);
        if (validationResult !== true) {
            throw new Error(validationResult);
        }

        this.offsets[keyString] = value;
        this.clock = clock;
        if (!clock) {
            this.bounds(keyString);
        }
    }

    delete(keyString) {
        this.offsets[keyString] = undefined;
        delete this.offsets[keyString];
    }

    /**
     * Validate the given offsets. This can be used for pre-validation of
     * offsets, for example by views validating user inputs.
     * @param {ClockOffsets} offsets The start and end offsets from a 'now' value.
     * @returns {string | true} A validation error, or true if valid
     * @method validateOffsets
     **/
    validateOffsets(offsets) {
        if ((offsets.start === undefined)
            || (offsets.end === undefined)
            || isNaN(offsets.start)
            || isNaN(offsets.end)
        ) {
            return "Start and end offsets must be specified as integer values";
        } else if (offsets.start >= offsets.end) {
            return "Specified start offset must be < end offset";
        }

        return true;
    }

    /**
     * Notify listeners of start and end time changes based on provided time and current offsets - only happens when in real time mode
     * @private
     * @param {number} timestamp A time from which boudns will be calculated
     * using current offsets.
     * @method tick
     */
    tick(timestamp) {
        if (!this.clock) {
            return;
        }

        Object.keys(this.offsets).forEach(keyString => {
            const clockOffsets = this.offsets[keyString];
            if (clockOffsets) {
                let bounds = {
                    start: timestamp + clockOffsets.start,
                    end: timestamp + clockOffsets.end
                };
                this.emit(keyString, 'bounds', bounds, true);
            }
        });
    }

    /**
     * Notify listeners of start and end time changes for a fixed timespan
     * @private
     * @param {key | string} keyString The identifier key of the domain object these bounds are set for
     * @method bounds
     */
    bounds(keyString) {
        const fixedOffsets = this.offsets[keyString];
        if (fixedOffsets) {
            this.emit(keyString, 'bounds', fixedOffsets, false);
        }
    }

    /**
     * Follow changes to fixed and real time bounds changes for a given domain object identifier key
     * @param {key | string} key The identifier key of the domain object these offsets
     * @param callback The function to invoke when time offsets change
     * @returns function function to call to stop observing changes to the time offsets
     * @method observe
     */
    observe(key, callback) {
        this.on(key, callback);

        return () => {
            this.off(key, callback);
        };
    }
}

export default IndependentTimeAPI;
