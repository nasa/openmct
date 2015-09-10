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

/**
 * The time conductor bundle adds a global control to the bottom of the
 * outermost viewing area. This controls both the range for time-based
 * queries and for time-based displays.
 *
 * @namespace platform/features/conductor
 */
define(
    function () {
        'use strict';

        /**
         * Wrapper for the `telemetry` capability which adds start/end
         * times to all requests based on the current state of a time
         * conductor.
         *
         * Note that both start and end times are in units which may
         * vary depending on the domains of telemetry being used. Most
         * commonly, these are UNIX timestamps in milliseconds.
         *
         * @memberof platform/features/conductor
         * @constructor
         * @augments {platform/telemetry.TelemetryCapability}
         * @param {platform/features/conductor.TimeConductor} timeConductor
         *        the time conductor which controls these queries
         * @param {platform/telemetry.TelemetryCapability} telemetryCapability
         *        the wrapped capability
         */
        function TimeConductor(start, end) {
            this.inner = { start: start, end: end };
            this.outer = { start: start, end: end };
        }

        /**
         * Get or set (if called with an argument) the start time for queries.
         * @param {number} [value] the start time to set
         * @returns {number} the start time
         */
        TimeConductor.prototype.queryStart = function (value) {
            if (arguments.length > 0) {
                this.outer.start = value;
            }
            return this.outer.start;
        };

        /**
         * Get or set (if called with an argument) the end time for queries.
         * @param {number} [value] the end time to set
         * @returns {number} the end time
         */
        TimeConductor.prototype.queryEnd = function (value) {
            if (arguments.length > 0) {
                this.outer.end = value;
            }
            return this.outer.end;
        };


        /**
         * Get or set (if called with an argument) the start time for displays.
         * @param {number} [value] the start time to set
         * @returns {number} the start time
         */
        TimeConductor.prototype.displayStart = function (value) {
            if (arguments.length > 0) {
                this.inner.start = value;
            }
            return this.inner.start;
        };

        /**
         * Get or set (if called with an argument) the end time for displays.
         * @param {number} [value] the end time to set
         * @returns {number} the end time
         */
        TimeConductor.prototype.displayEnd = function (value) {
            if (arguments.length > 0) {
                this.inner.end = value;
            }
            return this.inner.end;
        };

        return TimeConductor;
    }
);
