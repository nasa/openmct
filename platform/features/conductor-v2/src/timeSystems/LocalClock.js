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

define(['./TickSource'], function (TickSource) {
    /**
     * @interface
     * @constructor
     */
    function PeriodicTickSource ($timeout, interval) {
        TickSource.call(this);

        this.interval = interval;
        this.$timeout = $timeout;
        this.timeoutHandle = undefined;
    }

    PeriodicTickSource.prototype = Object.create(TickSource.prototype);

    PeriodicTickSource.prototype.start = function () {
        this.timeoutHandle = this.$timeout(this.tick.bind(this), this.interval);
    };

    PeriodicTickSource.prototype.stop = function () {
        if (this.timeoutHandle) {
            this.$timeout.cancel(this.timeoutHandle);
        }
    };

    PeriodicTickSource.prototype.tick = function () {
        this.listeners.forEach(function (listener){
            listener();
        });
    };

    PeriodicTickSource.prototype.listen = function (listener) {
        this.listeners.push(listener);

        if (this.listeners.length === 1){
            this.start();
        }

        return function () {
            this.listeners.splice(listeners.indexOf(listener));
            if (this.listeners.length === 0) {
                this.stop();
            }
        }.bind(this);
    };

    return TimeSystem;
});
