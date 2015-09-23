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
    ['./TimeConductor'],
    function (TimeConductor) {
        'use strict';

        var ONE_DAY_IN_MS = 1000 * 60 * 60 * 24,
            SIX_HOURS_IN_MS = ONE_DAY_IN_MS / 4;

        /**
         * Provides a single global instance of the time conductor, which
         * controls both query ranges and displayed ranges for telemetry
         * data.
         *
         * @constructor
         * @memberof platform/features/conductor
         * @param {Function} now a function which returns the current time
         *        as a UNIX timestamp, in milliseconds
         */
        function ConductorService(now, domains) {
            var initialEnd =
                Math.ceil(now() /  SIX_HOURS_IN_MS) * SIX_HOURS_IN_MS;

            this.conductor = new TimeConductor(
                initialEnd - ONE_DAY_IN_MS,
                initialEnd,
                domains
            );
        }

        /**
         * Get the global instance of the time conductor.
         * @returns {platform/features/conductor.TimeConductor} the
         *         time conductor
         */
        ConductorService.prototype.getConductor = function () {
            return this.conductor;
        };

        return ConductorService;
    }
);
