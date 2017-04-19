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
     * @implements TickSource
     * @constructor
     */
    function LocalClock(period) {
        EventEmitter.call(this);

        /*
        Metadata fields
         */
        this.key = 'local';
        this.mode = 'realtime';
        this.cssClass = 'icon-clock';
        this.label = 'Real-time';
        this.name = 'Real-time Mode';
        this.description = 'Monitor real-time streaming data as it comes in. The ' +
            'Time Conductor and displays will automatically advance themselves ' +
            'based on a UTC clock.';

        this.period = period;
        this.timeoutHandle = undefined;
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

    LocalClock.prototype.tick = function () {
        var now = Date.now();
        this.emit("tick", now);
        this.timeoutHandle = setTimeout(this.tick.bind(this), this.period);
    };

    /**
     * Register a listener for the local clock. When it ticks, the local
     * clock will provide the current local system time
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    LocalClock.prototype.on = function (event, listener) {
        var result = this.on.apply(this, arguments);

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
    LocalClock.prototype.off = function (event, listener) {
        var result = this.off.apply(this, arguments);

        if (this.listeners(event).length === 0) {
            this.stop();
        }

        return result;
    };

    return LocalClock;
});
