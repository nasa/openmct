/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * Calls functions every second, as close to the actual second
         * tick as is feasible.
         * @constructor
         * @memberof platform/features/clock
         * @param $timeout Angular's $timeout
         * @param {Function} now function to provide the current time in ms
         */
        function TickerService($timeout, now) {
            var self = this;

            function tick() {
                var timestamp = now(),
                    millis = timestamp % 1000;

                // Only update callbacks if a second has actually passed.
                if (timestamp >= self.last + 1000) {
                    self.callbacks.forEach(function (callback) {
                        callback(timestamp);
                    });
                    self.last = timestamp - millis;
                }

                // Try to update at exactly the next second
                $timeout(tick, 1000 - millis, true);
            }

            tick();

            this.callbacks = [];
            this.last = now() - 1000;
        }

        /**
         * Listen for clock ticks. The provided callback will
         * be invoked with the current timestamp (in milliseconds
         * since Jan 1 1970) at regular intervals, as near to the
         * second boundary as possible.
         *
         * @param {Function} callback callback to invoke
         * @returns {Function} a function to unregister this listener
         */
        TickerService.prototype.listen = function (callback) {
            var self = this;

            self.callbacks.push(callback);

            // Provide immediate feedback
            callback(this.last);

            // Provide a deregistration function
            return function () {
                self.callbacks = self.callbacks.filter(function (cb) {
                    return cb !== callback;
                });
            };
        };

        return TickerService;
    }
);
