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
        function PersistenceQueueImpl($q, $timeout, handler, DELAY) {
            var self,
                persistences = {},
                objects = {},
                lastObservedSize = 0,
                pendingTimeout,
                flushPromise,
                activeDefer = $q.defer();

            // Check if the queue's size has stopped increasing)
            function quiescent() {
                return Object.keys(persistences).length === lastObservedSize;
            }

            // Persist all queued objects
            function flush() {
                // Get a local reference to the active promise;
                // this will be replaced with a promise for the next round
                // of persistence calls, so we want to make sure we clear
                // the correct one when this flush completes.
                var flushingDefer = activeDefer;

                // Clear the active promise for a queue flush
                function clearFlushPromise(value) {
                    flushPromise = undefined;
                    flushingDefer.resolve(value);
                    return value;
                }

                // Persist all queued objects
                flushPromise = handler.persist(persistences, objects, self)
                    .then(clearFlushPromise, clearFlushPromise);

                // Reset queue, etc.
                persistences = {};
                objects = {};
                lastObservedSize = 0;
                pendingTimeout = undefined;
                activeDefer = $q.defer();
            }

            // Schedule a flushing of the queue (that is, plan to flush
            // all objects in the queue)
            function scheduleFlush() {
                function maybeFlush() {
                    // Timeout fired, so clear it
                    pendingTimeout = undefined;
                    // Only flush when we've stopped receiving updates
                    (quiescent() ? flush : scheduleFlush)();
                    // Update lastObservedSize to detect quiescence
                    lastObservedSize = Object.keys(persistences).length;
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

                return activeDefer.promise;
            }

            // If no delay is provided, use a default
            DELAY = DELAY || 0;

            self = {
                /**
                 * Queue persistence of a domain object.
                 * @param {DomainObject} domainObject the domain object
                 * @param {PersistenceCapability} persistence the object's
                 *        undecorated persistence capability
                 */
                put: function (domainObject, persistence) {
                    var id = domainObject.getId();
                    persistences[id] = persistence;
                    objects[id] = domainObject;
                    return scheduleFlush();
                }
            };

            return self;
        }

        return PersistenceQueueImpl;
    }
);