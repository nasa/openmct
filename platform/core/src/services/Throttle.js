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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Throttler for function executions, registered as the `throttle`
         * service.
         *
         * Usage:
         *
         *     throttle(fn, delay, [apply])
         *
         * Returns a function that, when invoked, will invoke `fn` after
         * `delay` milliseconds, only if no other invocations are pending.
         * The optional argument `apply` determines whether.
         *
         * The returned function will itself return a `Promise` which will
         * resolve to the returned value of `fn` whenever that is invoked.
         *
         * @returns {Function}
         * @memberof platform/core
         */
        function Throttle($timeout) {
            /**
             * Throttle this function.
             * @param {Function} fn the function to throttle
             * @param {number} [delay] the delay, in milliseconds, before
             *        executing this function; defaults to 0.
             * @param {boolean} apply true if a `$apply` call should be
             *        invoked after this function executes; defaults to
             *        `false`.
             * @memberof platform/core.Throttle#
             */
            return function (fn, delay, apply) {
                var activeTimeout;

                // Clear active timeout, so that next invocation starts
                // a new one.
                function clearActiveTimeout() {
                    activeTimeout = undefined;
                }

                // Defaults
                delay = delay || 0;
                apply = apply || false;

                return function () {
                    // Start a timeout if needed
                    if (!activeTimeout) {
                        activeTimeout = $timeout(fn, delay, apply);
                        activeTimeout.then(clearActiveTimeout);
                    }
                    // Return whichever timeout is active (to get
                    // a promise for the results of fn)
                    return activeTimeout;
                };
            };
        }

        return Throttle;
    }
);

