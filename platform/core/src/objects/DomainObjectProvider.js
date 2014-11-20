/*global define,Promise*/

/**
 * Module defining DomainObjectProvider. Created by vwoeltje on 11/7/14.
 */
define(
    ["./DomainObject"],
    function (DomainObject) {
        "use strict";

        /**
         * Construct a new provider for domain objects.
         *
         * @param {ModelService} modelService the service which shall
         *        provide models (persistent state) for domain objects
         * @param {CapabilityService} capabilityService the service
         *        which provides capabilities (dynamic behavior)
         *        for domain objects.
         * @constructor
         */
        function DomainObjectProvider(modelService, capabilityService) {
            // Given a models object (containing key-value id-model pairs)
            // create a function that will look up from the capability
            // service based on id; for handy mapping below.
            function capabilityResolver(models) {
                return function (id) {
                    var model = models[id];
                    return model ?
                            capabilityService.getCapabilities(model) :
                            undefined;
                };
            }

            // Assemble the results from the model service and the
            // capability service into one value, suitable to return
            // from this service. Note that ids are matched to capabilities
            // by index.
            function assembleResult(ids, models, capabilities) {
                var result = {};
                ids.forEach(function (id, index) {
                    if (models[id]) {
                        // Create the domain object
                        result[id] = new DomainObject(
                            id,
                            models[id],
                            capabilities[index]
                        );
                    }
                });
                return result;
            }

            // Get object instances; this is the useful API exposed by the
            // domain object provider.
            function getObjects(ids) {
                return modelService.getModels(ids).then(function (models) {
                    return Promise.all(
                        ids.map(capabilityResolver(models))
                    ).then(function (capabilities) {
                        return assembleResult(ids, models, capabilities);
                    });
                });
            }

            return {
                /**
                 * Get a set of objects associated with a list of identifiers.
                 * The provided result may contain a subset or a superset of
                 * the total number of objects.
                 *
                 * @param {Array<string>} ids the identifiers for domain objects
                 *        of interest.
                 * @return {Promise<object<string, DomainObject>>} a promise
                 *         for an object containing key-value pairs, where keys
                 *         are string identifiers for domain objects, and
                 *         values are the corresponding domain objects themselves.
                 * @memberof module:core/object/object-provider.ObjectProvider#
                 */
                getObjects: getObjects
            };
        }

        return DomainObjectProvider;
    }
);