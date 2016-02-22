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
/*global define,requirejs*/

define(
    ['moment', 'moment-duration-format'],
    function (moment) {
        "use strict";

        var SHORT_FORMAT = "HH:mm:ss",
            LONG_FORMAT = "d[D] HH:mm:ss";

        /**
         * Provides formatting functions for Timers.
         *
         * Display formats for timers are a little different from what
         * moment.js provides, so we have custom logic here. This specifically
         * supports `TimerController`.
         *
         * @constructor
         * @memberof platform/features/clock
         */
        function TimerFormatter() {
        }

        // Round this timestamp down to the second boundary
        // (e.g. 1124ms goes down to 1000ms, -2400ms goes down to -3000ms)
        function toWholeSeconds(duration) {
            return Math.abs(Math.floor(duration / 1000) * 1000);
        }

        /**
         * Format a duration for display, using the short form.
         * (e.g. 03:33:11)
         * @param {number} duration the duration, in milliseconds
         * @param {boolean} sign true if positive
         */
        TimerFormatter.prototype.short = function (duration) {
            return moment.duration(toWholeSeconds(duration), 'ms')
                .format(SHORT_FORMAT, { trim: false });
        };

        /**
         * Format a duration for display, using the long form.
         * (e.g. 0d 03:33:11)
         * @param {number} duration the duration, in milliseconds
         * @param {boolean} sign true if positive
         */
        TimerFormatter.prototype.long = function (duration) {
            return moment.duration(toWholeSeconds(duration), 'ms')
                .format(LONG_FORMAT, { trim: false });
        };

        return TimerFormatter;
    }
);
