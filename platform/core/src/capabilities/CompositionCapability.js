/*global define*/

/**
 * Module defining CompositionCapability. Created by vwoeltje on 11/7/14.
 */
define(
    ["./ContextualDomainObject"],
    function (ContextualDomainObject) {
        "use strict";

        /**
         * Composition capability. A domain object's composition is the set of
         * domain objects it contains. This is available as an array of
         * identifiers in the model; the composition capability makes this
         * available as an array of domain object instances, which may
         * require consulting the object service (e.g. to trigger a database
         * query to retrieve the nested object models.)
         *
         * @constructor
         */
        function CompositionCapability($injector, domainObject) {
            var objectService,
                lastPromise,
                lastModified;

            // Get a reference to the object service from $injector
            function injectObjectService() {
                objectService = $injector.get("objectService");
                return objectService;
            }

            // Get a reference to the object service (either cached or
            // from the injector)
            function getObjectService() {
                return objectService || injectObjectService();
            }

            // Promise this domain object's composition (an array of domain
            // object instances corresponding to ids in its model.)
            function promiseComposition() {
                var model = domainObject.getModel(),
                    ids;

                // Then filter out non-existent objects,
                // and wrap others (such that they expose a
                // "context" capability)
                function contextualize(objects) {
                    return ids.filter(function (id) {
                        return objects[id];
                    }).map(function (id) {
                        return new ContextualDomainObject(
                            objects[id],
                            domainObject
                        );
                    });
                }

                // Make a new request if we haven't made one, or if the
                // object has been modified.
                if (!lastPromise || lastModified !== model.modified) {
                    ids = model.composition || [];
                    lastModified = model.modified;
                    // Load from the underlying object service
                    lastPromise = getObjectService().getObjects(ids)
                        .then(contextualize);
                }

                return lastPromise;
            }

            return {
                /**
                 * Request the composition of this object.
                 * @returns {Promise.<DomainObject[]>} a list of all domain
                 *     objects which compose this domain object.
                 */
                invoke: promiseComposition
            };
        }

        /**
         * Test to determine whether or not this capability should be exposed
         * by a domain object based on its model. Checks for the presence of
         * a composition field, that must be an array.
         * @param model the domain object model
         * @returns {boolean} true if this object has a composition
         */
        CompositionCapability.appliesTo = function (model) {
            return Array.isArray((model || {}).composition);
        };

        return CompositionCapability;
    }
);