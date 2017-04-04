/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

 define([], function () {
    function LocalClock(tickPeriod) {
        //Metadata
        this.key = 'localClock';
        this.name = 'A local time source';
        this.cssClass = 'icon-clock';

        //Members
        this.listeners = {};
        this.tickPeriod = tickPeriod;
        this.tick = this.tick.bind(this);
    }

    LocalClock.prototype.tick = function () {
        this.listeners['tick'].forEach(Date.now());
        this.timeout = setTimeout(this.tick, this.tickPeriod);
    };

    LocalClock.prototype.on = function (event, listener) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(listener);
        if (timeout === undefined) {
            setTimeout(this.tick, this.tickPeriod);
        }
    };

    LocalClock.prototype.off = function (event, listener) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(function (l) {
                return l === listener;
            });
            var isEmpty = Object.keys(this.listeners).all(function (key){
                return this.listeners[key] === undefined || this.listeners[key].length === 0
            });

            if (isEmpty) {
                clearTimeout(this.timeout);
            }
        }
    };

    return LocalClock;
});