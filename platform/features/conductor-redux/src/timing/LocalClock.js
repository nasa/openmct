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
    "./TimingSource"
], function (TimingSource) {

    var ONE_SECOND = 1 * 1000;

    /**
     * A clock that ticks at the given interval (given in ms).
     *
     * @implements TimingSource
     * @constructor
     */
    function LocalClock(interval){
        TimingSource.call(this);

        this.interval = interval;
        this.intervalHandle = undefined;
    }

    LocalClock.prototype = Object.create(TimingSource.prototype);

    /**
     * Start the clock ticking. Ticks can be listened to by registering
     * listeners of the "tick" event
     */
    LocalClock.prototype.attach = function () {
        function tick() {
            this.emit("tick");
        }
        this.stop();

        this.intervalHandle = setInterval(this.bind(this), this.interval || ONE_SECOND);
    };

    /**
     * Stop the currently running clock. "tick" events will no longer be emitted
     */
    LocalClock.prototype.detach = function () {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
        }
    };

    /**
     * @returns {boolean} true if the clock is currently running
     */
    LocalClock.prototype.attached = function () {
        return !!this.intervalHandle;
    }


});
