/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Handles actual persistence invocations for queeud persistence
         * attempts, in a group. Handling in a group in this manner
         * also allows failure to be handled in a group (e.g. in a single
         * summary dialog.)
         * @param $q Angular's $q, for promises
         * @param {PersistenceFailureHandler} handler to invoke in the event
         *        that a persistence attempt fails.
         */
        function PersistenceQueueHandler($q, failureHandler) {

            // Handle a group of persistence invocations
            function persistGroup(ids, persistences, domainObjects, queue) {
                var failures = [];

                // Try to persist a specific domain object
                function tryPersist(id) {
                    // Look up its persistence capability from the provided
                    // id->persistence object.
                    var persistence = persistences[id],
                        domainObject = domainObjects[id];

                    // Put a domain object back in the queue
                    // (e.g. after Overwrite)
                    function requeue() {
                        return queue.put(domainObject, persistence);
                    }

                    // Handle success
                    function succeed(value) {
                        return value;
                    }

                    // Handle failure (build up a list of failures)
                    function fail(error) {
                        failures.push({
                            id: id,
                            persistence: persistence,
                            domainObject: domainObject,
                            requeue: requeue,
                            error: error
                        });
                        return false;
                    }

                    // Invoke the actual persistence capability, then
                    // note success or failures
                    return persistence.persist().then(succeed, fail);
                }

                // Handle any failures from the full operation
                function handleFailure(value) {
                    return failures.length > 0 ?
                            failureHandler.handle(failures) :
                            value;
                }

                // Try to persist everything, then handle any failures
                return $q.all(ids.map(tryPersist)).then(handleFailure);
            }


            return {
                /**
                 * Invoke the persist method on the provided persistence
                 * capabilities.
                 * @param {Object.<string,PersistenceCapability>} persistences
                 *        capabilities to invoke, in id->capability pairs.
                 * @param {Object.<string,DomainObject>} domainObjects
                 *        associated domain objects, in id->object pairs.
                 * @param {PersistenceQueue} queue the persistence queue,
                 *        to requeue as necessary
                 */
                persist: function (persistences, domainObjects, queue) {
                    var ids = Object.keys(persistences);
                    return persistGroup(ids, persistences, domainObjects, queue);
                }
            };
        }

        return PersistenceQueueHandler;
    }
);