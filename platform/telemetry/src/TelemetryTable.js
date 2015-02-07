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
         * @constructor
         */
        function TelemetryTable() {
            var table;

            return {
                /**
                 * Check if any value groups remain in this pool.
                 * @return {boolean} true if value groups remain
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