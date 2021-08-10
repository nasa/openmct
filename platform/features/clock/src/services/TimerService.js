/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

    /**
     * Tracks the currently-followed Timer object. Used by
     * timelines et al to synchronize to a particular timer.
     *
     * The TimerService emits `change` events when the active timer
     * is changed.
     */
    function TimerService(openmct) {
        EventEmitter.apply(this);
        this.time = openmct.time;
        this.objects = openmct.objects;
    }

    TimerService.prototype = Object.create(EventEmitter.prototype);

    /**
     * Set (or clear, if `timer` is undefined) the currently active timer.
     * @param {DomainObject} timer the new active timer
     * @emits change
     */
    TimerService.prototype.setTimer = function (timer) {
        this.timer = timer;
        this.emit('change', timer);

        if (this.stopObserving) {
            this.stopObserving();
            delete this.stopObserving;
        }

        if (timer) {
            this.stopObserving =
                this.objects.observe(timer, '*', this.setTimer.bind(this));
        }
    };

    /**
     * Get the currently active timer.
     * @return {DomainObject} the active timer
     * @emits change
     */
    TimerService.prototype.getTimer = function () {
        return this.timer;
    };

    /**
     * Check if there is a currently active timer.
     * @return {boolean} true if there is a timer
     */
    TimerService.prototype.hasTimer = function () {
        return Boolean(this.timer);
    };

    /**
     * Convert the provided timestamp to milliseconds relative to
     * the active timer.
     * @return {number} milliseconds since timer start
     */
    TimerService.prototype.convert = function (timestamp) {
        var clock = this.time.clock();
        var canConvert = this.hasTimer()
            && Boolean(clock)
            && this.timer.timerState !== 'stopped';

        if (!canConvert) {
            return undefined;
        }

        var now = clock.currentValue();
        var delta = this.timer.timerState === 'paused'
            ? now - this.timer.pausedTime : 0;
        var epoch = this.timer.timestamp;

        return timestamp - epoch - delta;
    };

    /**
     * Get the value of the active clock, adjusted to be relative to the active
     * timer. If there is no clock or no active timer, this will return
     * `undefined`.
     * @return {number} milliseconds since the start of the active timer
     */
    TimerService.prototype.now = function () {
        var clock = this.time.clock();

        return clock && this.convert(clock.currentValue());
    };

    return TimerService;
});
