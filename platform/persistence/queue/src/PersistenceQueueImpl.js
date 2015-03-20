/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The PersistenceQueue is used by the QueuingPersistenceCapability
         * to aggregrate calls for object persistence. These are then issued
         * in a group, such that if some or all are rejected, this result can
         * be shown to the user (again, in a group.)
         *
         * This implementation is separate out from PersistenceQueue, which
         * handles the wiring of injected dependencies into an instance of
         * this class.
         *
         * @param $timeout Angular's $timeout
         * @param {PersistenceQueueHandler} handler handles actual
         *        persistence when the queue is flushed
         * @param {number} [DELAY] optional; delay in milliseconds between
         *        attempts to flush the queue
         */
        function PersistenceQueueImpl($timeout, handler, DELAY) {
            var queue = {},
                objects = {},
                lastObservedSize = 0,
                pendingTimeout,
                flushPromise;

            // Check if the queue's size has stopped increasing)
            function quiescent() {
                return Object.keys(queue).length === lastObservedSize;
            }

            // Persist all queued objects
            function flush() {
                // Persist all queued objects
                flushPromise = handler.persist(queue, objects);

                // When persisted, clear the active promise
                flushPromise.then(function () {
                    flushPromise = undefined;
                });

                // Reset queue, etc.
                queue = {};
                objects = {};
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
                 * @param {DomainObject} domainObject the domain object
                 * @param {PersistenceCapability} persistence the object's
                 *        undecorated persistence capability
                 */
                put: function (domainObject, persistence) {
                    var id = domainObject.getId();
                    queue[id] = persistence;
                    objects[id] = domainObject;
                    scheduleFlush();
                }
            };
        }

        return PersistenceQueueImpl;
    }
);