/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Supports TelemetrySubscription. Provides a simple data structure
         * (with a pool-like interface) that aggregates key-value pairs into
         * a queued series of large objects, ensuring that no value is
         * overwritten (but consolidated non-overlapping keys into single
         * objects.)
         * @constructor
         */
        function TelemetryQueue() {
            var queue = [];

            // Look up an object in the queue that does not have a value
            // assigned to this key (or, add a new one)
            function getFreeObject(key) {
                var index = 0, object;

                // Look for an existing queue position where we can store
                // a value to this key without overwriting an existing value.
                for (index = 0; index < queue.length; index += 1) {
                    if (queue[index][key] === undefined) {
                        return queue[index];
                    }
                }

                // If we made it through the loop, values have been assigned
                // to that key in all queued containers, so we need to queue
                // up a new  container for key-value pairs.
                object = {};
                queue.push(object);
                return object;
            }

            return {
                /**
                 * Check if any value groups remain in this pool.
                 * @return {boolean} true if value groups remain
                 */
                isEmpty: function () {
                    return queue.length < 1;
                },
                /**
                 * Retrieve the next value group from this pool.
                 * This gives an object containing key-value pairs,
                 * where keys and values correspond to the arguments
                 * given to previous put functions.
                 * @return {object} key-value pairs
                 */
                poll: function () {
                    return queue.shift();
                },
                /**
                 * Put a key-value pair into the pool.
                 * @param {string} key the key to store the value under
                 * @param {*} value the value to store
                 */
                put: function (key, value) {
                    getFreeObject(key)[key] = value;
                }
            };
        }

        return TelemetryQueue;
    }
);