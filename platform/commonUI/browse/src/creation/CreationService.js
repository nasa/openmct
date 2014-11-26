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
         * persisting new domain objects. This is
         * @constructor
         */
        function CreationService(persistenceService, $q, $log) {

            function doPersist(space, id, model) {
                return persistenceService.createObject(
                    space,
                    id,
                    model
                ).then(function () { return id; });
            }

            function addToComposition(id, parent) {
                var mutatationResult = parent.useCapability("mutation", function (model) {
                    if (Array.isArray(model.composition)) {
                        if (model.composition.indexOf(id) === -1) {
                            model.composition.push(id);
                        }
                    } else {
                        $log.warn(NO_COMPOSITION_WARNING + parent.getId());
                    }
                });

                return $q.when(mutatationResult).then(function (result) {
                    var persistence = parent.getCapability("persistence");

                    if (!result) {
                        $log.error("Could not mutate " + parent.getId());
                    }

                    if (!persistence) {
                        $log.error([
                            "Expected to be able to persist ",
                            parent.getId(),
                            " but could not."
                        ].join(""));
                        return undefined;
                    }

                    return persistence.persist();
                });
            }

            function createObject(model, parent) {
                var persistence = parent.getCapability("persistence"),
                    result = $q.defer(),
                    space;

                if (persistence) {
                    space = persistence.getSpace();
                    return $q.when(
                        uuid()
                    ).then(function (id) {
                        return doPersist(space, id, model);
                    }).then(function (id) {
                        return addToComposition(id, parent);
                    });
                } else {
                    $log.warn(NON_PERSISTENT_WARNING);
                    $q.reject(new Error(NON_PERSISTENT_WARNING));
                }

                return result.promise;
            }

            return {
                createObject: createObject
            };
        }

        return CreationService;
    }
);