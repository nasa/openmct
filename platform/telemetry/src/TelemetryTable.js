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
         * Supports TelemetrySubscription. Provides a simple data structure
         * (with a pool-like interface) that aggregates key-value pairs into
         * one large object, overwriting new values as necessary. Stands
         * in contrast to the TelemetryQueue, which will avoid overwriting
         * values.
         * @memberof platform/telemetry
         * @constructor
         */
        function TelemetryTable() {
            var table;

            return {
                /**
                 * Check if any value groups remain in this pool.
                 * @return {boolean} true if value groups remain
                 * @memberof platform/telemetry.TelemetryTable#
                 */
                isEmpty: function () {
                    return !table;
                },
                /**
                 * Retrieve the next value group from this pool.
                 * This gives an object containing key-value pairs,
                 * where keys and values correspond to the arguments
                 * given to previous put functions.
                 * @return {object} key-value pairs
                 * @memberof platform/telemetry.TelemetryTable#
                 */
                poll: function () {
                    var t = table;
                    table = undefined;
                    return t;
                },
                /**
                 * Put a key-value pair into the pool.
                 * @param {string} key the key to store the value under
                 * @param {*} value the value to store
                 * @memberof platform/telemetry.TelemetryTable#
                 */
                put: function (key, value) {
                    table = table || {};
                    table[key] = value;
                }
            };
        }

        return TelemetryTable;
    }
);
