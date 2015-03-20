/*global define*/

define(
    [],
    function () {
        "use strict";

        function QueuedPersistenceHandler($q, failureHandler) {

            function persistGroup(ids, queue, domainObjects) {
                var failures = [];

                function tryPersist(id) {
                    var persistence = queue[id];

                    function succeed(value) {
                        return value;
                    }

                    function fail(error) {
                        failures.push({
                            id: id,
                            domainObject: domainObjects[id],
                            error: error
                        });
                        return false;
                    }

                    return persistence.persist().then(succeed, fail);
                }

                function handleFailure(value) {
                    return failures.length > 0 ?
                            failureHandler.handle(failures) : value;
                }

                return $q.all(ids.map(tryPersist)).then(handleFailure);
            }


            return {
                /**
                 * Invoke the persist method on the provided persistence
                 * capabilities.
                 * @param {Object.<string,PersistenceCapability>} queue
                 *        capabilities to invoke, in id->capability pairs.
                 * @param {Object.<string,DomainObject>} domainObjects
                 *        associated domain objects, in id->object pairs.
                 */
                persist: function (queue, domainObjects) {
                    var ids = Object.keys(queue);
                    return persistGroup(ids, queue, domainObjects);
                }
            };
        }

        return QueuedPersistenceHandler;
    }
);