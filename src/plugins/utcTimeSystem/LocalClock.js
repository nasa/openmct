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
     * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
     * application based on UTC time values provided by a ticking local clock,
     * with the periodicity specified.
     * @param {number} period The periodicity with which the clock should tick
     * @constructor
     */
    function LocalClock(period) {
        EventEmitter.call(this);

        /*
        Metadata fields
         */
        this.key = 'local';
        this.cssClass = 'icon-clock';
        this.name = 'Local Clock';
        this.description = "Provides UTC timestamps every second from the local system clock.";

        this.period = period;
        this.timeoutHandle = undefined;
        this.lastTick = Date.now();
    }

    LocalClock.prototype = Object.create(EventEmitter.prototype);

    /**
     * @private
     */
    LocalClock.prototype.start = function () {
        this.timeoutHandle = setTimeout(this.tick.bind(this), this.period);
    };

    /**
     * @private
     */
    LocalClock.prototype.stop = function () {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = undefined;
        }
    };

    /**
     * @private
     */
    LocalClock.prototype.tick = function () {
        const now = Date.now();
        this.emit("tick", now);
        this.lastTick = now;
        this.timeoutHandle = setTimeout(this.tick.bind(this), this.period);
    };

    /**
     * Register a listener for the local clock. When it ticks, the local
     * clock will provide the current local system time
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    LocalClock.prototype.on = function (event) {
        const result = EventEmitter.prototype.on.apply(this, arguments);

        if (this.listeners(event).length === 1) {
            this.start();
        }

        return result;
    };

    /**
     * Register a listener for the local clock. When it ticks, the local
     * clock will provide the current local system time
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    LocalClock.prototype.off = function (event) {
        const result = EventEmitter.prototype.off.apply(this, arguments);

        if (this.listeners(event).length === 0) {
            this.stop();
        }

        return result;
    };

    /**
     * @returns {number} The last value provided for a clock tick
     */
    LocalClock.prototype.currentValue = function () {
        return this.lastTick;
    };

    return LocalClock;
});
