/*global define,Promise*/

/**
 * Module defining CreateService. Created by vwoeltje on 11/10/14.
 */
define(
    ["../../lib/uuid"],
    function (uuid) {
        "use strict";

        var NON_PERSISTENT_WARNING =
                "Tried to create an object in non-persistent container.",
            NO_COMPOSITION_WARNING =
                "Could not add to composition; no composition in ";

        /**
         * The creation service is responsible for instantiating and
         * persisting new domain objects. Handles all actual object
         * mutation and persistence associated with domain object
         * creation.
         * @constructor
         */
        function CreationService(persistenceService, $q, $log) {

            // Persist the new domain object's model; it will be fully
            // constituted as a domain object when loaded back, as all
            // domain object models are.
            function doPersist(space, id, model) {
                return persistenceService.createObject(
                    space,
                    id,
                    model
                ).then(function () { return id; });
            }

            // Add the newly-created object's id to the parent's
            // composition, so that it will subsequently appear
            // as a child contained by that parent.
            function addToComposition(id, parent, parentPersistence) {
                var mutatationResult = parent.useCapability("mutation", function (model) {
                    if (Array.isArray(model.composition)) {
                        // Don't add if the id is already there
                        if (model.composition.indexOf(id) === -1) {
                            model.composition.push(id);
                        }
                    } else {
                        // This is abnormal; composition should be an array
                        $log.warn(NO_COMPOSITION_WARNING + parent.getId());
                        return false; // Cancel mutation
                    }
                });

                return $q.when(mutatationResult).then(function (result) {
                    if (!result) {
                        $log.error("Could not mutate " + parent.getId());
                        return undefined;
                    }

                    return parentPersistence.persist();
                });
            }

            // Create a new domain object with the provided model as a
            // member of the specified parent's composition
            function createObject(model, parent) {
                var persistence = parent.getCapability("persistence");

                // We need the parent's persistence capability to determine
                // what space to create the new object's model in.
                if (!persistence) {
                    $log.warn(NON_PERSISTENT_WARNING);
                    return $q.reject(new Error(NON_PERSISTENT_WARNING));
                }

                // We create a new domain object in three sequential steps:
                // 1. Get a new UUID for the object
                // 2. Create a model with that ID in the persistence space
                // 3. Add that ID to
                return $q.when(
                    uuid()
                ).then(function (id) {
                    return doPersist(persistence.getSpace(), id, model);
                }).then(function (id) {
                    return addToComposition(id, parent, persistence);
                });
            }

            return {
                /**
                 * Create a new domain object with the provided model, as
                 * a member of the provided parent domain object's composition.
                 * This parent will additionally determine which persistence
                 * space an object is created within (as it is possible to
                 * have multiple persistence spaces attached.)
                 *
                 * @param {object} model the model for the newly-created
                 *        domain object
                 * @param {DomainObject} parent the domain object which
                 *        should contain the newly-created domain object
                 *        in its composition
                 */
                createObject: createObject
            };
        }

        return CreationService;
    }
);