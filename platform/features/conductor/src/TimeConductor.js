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
         * Tracks the current state of the time conductor.
         *
         * @memberof platform/features/conductor
         * @constructor
         * @param {number} start the initial start time
         * @param {number} end the initial end time
         */
        function TimeConductor(start, end, domains) {
            this.range = { start: start, end: end };
            this.domains = domains;
            this.activeDomain = domains[0];
        }

        /**
         * Get or set (if called with an argument) the start time for displays.
         * @param {number} [value] the start time to set
         * @returns {number} the start time
         */
        TimeConductor.prototype.displayStart = function (value) {
            if (arguments.length > 0) {
                this.range.start = value;
            }
            return this.range.start;
        };

        /**
         * Get or set (if called with an argument) the end time for displays.
         * @param {number} [value] the end time to set
         * @returns {number} the end time
         */
        TimeConductor.prototype.displayEnd = function (value) {
            if (arguments.length > 0) {
                this.range.end = value;
            }
            return this.range.end;
        };

        /**
         * Get available domain options which can be used to bound time
         * selection.
         * @returns {TelemetryDomainMetadata[]} available domains
         */
        TimeConductor.prototype.domainOptions = function () {
            return this.domains;
        };

        /**
         * Get or set (if called with an argument) the active domain.
         * @param {string} [key] the key identifying the domain choice
         * @returns {TelemetryDomainMetadata} the active telemetry domain
         */
        TimeConductor.prototype.domain = function (key) {
            var i;

            if (arguments.length > 0) {
                for (i = 0; i < this.domains.length; i += 1) {
                    if (this.domains[i].key === key) {
                        return (this.activeDomain = this.domains[i]);
                    }
                }

                throw new Error("Unknown domain " + key);
            }

            return this.activeDomain;
        };

        return TimeConductor;
    }
);
