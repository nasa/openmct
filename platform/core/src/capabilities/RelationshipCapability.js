/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Relationship capability. Describes a domain objects relationship
         * to other domain objects within the system, and provides a way to
         * access related objects.
         *
         * For most cases, this is not the capability to use; the
         * `composition` capability describes the more general relationship
         * between objects typically seen (e.g. in the tree.) This capability
         * is instead intended for the more unusual case of relationships
         * which are not intended to appear in the tree, but are instead
         * intended only for special, limited usage.
         *
         * @constructor
         */
        function RelationshipCapability($injector, domainObject) {
            var objectService,
                lastPromise = {},
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
            function promiseRelationships(key) {
                var model = domainObject.getModel(),
                    ids;

                // Package objects as an array
                function packageObject(objects) {
                    return ids.map(function (id) {
                        return objects[id];
                    }).filter(function (obj) {
                        return obj;
                    });
                }

                // Clear cached promises if modification has occurred
                if (lastModified !== model.modified) {
                    lastPromise = {};
                    lastModified = model.modified;
                }

                // Make a new request if needed
                if (!lastPromise[key]) {
                    ids = (model.relationships || {})[key] || [];
                    lastModified = model.modified;
                    // Load from the underlying object service
                    lastPromise[key] = getObjectService().getObjects(ids)
                        .then(packageObject);
                }

                return lastPromise[key];
            }

            // List types of relationships which this object has
            function listRelationships() {
                var relationships =
                    (domainObject.getModel() || {}).relationships || {};

                // Check if this key really does expose an array of ids
                // (to filter out malformed relationships)
                function isArray(key) {
                    return Array.isArray(relationships[key]);
                }

                return Object.keys(relationships).filter(isArray).sort();
            }

            return {
                /**
                 * List all types of relationships exposed by this
                 * object.
                 * @returns {string[]} a list of all relationship types
                 */
                listRelationships: listRelationships,
                /**
                 * Request related objects, with a given relationship type.
                 * This will typically require asynchronous lookup, so this
                 * returns a promise.
                 * @param {string} key the type of relationship
                 * @returns {Promise.<DomainObject[]>} a promise for related
                 *          domain objects
                 */
                getRelatedObjects: promiseRelationships
            };
        }

        /**
         * Test to determine whether or not this capability should be exposed
         * by a domain object based on its model. Checks for the presence of
         * a `relationships` field, that must be an object.
         * @param model the domain object model
         * @returns {boolean} true if this object has relationships
         */
        RelationshipCapability.appliesTo = function (model) {
            return !!(model || {}).relationships;
        };

        return RelationshipCapability;
    }
);