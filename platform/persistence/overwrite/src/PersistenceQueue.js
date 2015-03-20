/*global define*/

define(
    ['./QueuedPersistenceHandler'],
    function (QueuedPersistenceHandler) {
        "use strict";

        /**
         * The PersistenceQueue is used by the QueuingPersistenceCapability
         * to aggregrate calls for object persistence. These are then issued
         * in a group, such that if some or all are rejected, this result can
         * be shown to the user (again, in a group.)
         *
         * @param $q Angular's $q
         * @param $timeout Angular's $timeout
         * @param {number} [DELAY] optional; delay in milliseconds between
         *        attempts to flush the queue
         */
        function PersistenceQueue($q, $timeout, DELAY) {
            var queue = {},
                lastObservedSize = 0,
                handler = new QueuedPersistenceHandler($q),
                pendingTimeout,
                flushPromise;

            // Check if the queue's size has stopped increasing)
            function quiescent() {
                return Object.keys(queue).length === lastObservedSize;
            }

            // Look up a queued persistence capability
            function lookup(id) {
                return queue[id];
            }

            // Persist all queued objects
            function flush() {
                // Convert to array of persistence capabilities
                var toFlush = Object.keys(queue).map(lookup);

                // Persist them
                flushPromise = handler.persist(toFlush);

                // When persisted, clear the active promise
                flushPromise.then(function () {
                    flushPromise = undefined;
                });

                // Reset queue, etc.
                queue = {};
                lastObservedSize = 0;
                pendingTimeout = undefined;
            }

            // Schedule a flushing of the queue (that is, plan to flush
            // all objects in the queue)
            function scheduleFlush() {
                function maybeFlush() {
                    // Only flush when we've stopped receiving updates
                    (quiescent() ? flush : scheduleFlush)();
                }

                // If we are already flushing the queue...
                if (flushPromise) {
                    // Wait until that's over before considering a flush
                    flushPromise.then(maybeFlush);
                } else {
                    // Otherwise, schedule a flush on a timeout (to give
                    // a window for other updates to get aggregated)
                    pendingTimeout = pendingTimeout ||
                        $timeout(maybeFlush, DELAY, false);
                }
            }


            // If no delay is provided, use a default
            DELAY = DELAY || 0;

            return {
                /**
                 * Queue persistence of a domain object.
                 * @param {string} id the domain object's identifier
                 * @param {PersistenceCapability} persistence the object's
                 *        undecorated persistence capability
                 */
                put: function (id, persistence) {
                    queue[id] = persistence;
                }
            };
        }

        return PersistenceQueue;
    }
);