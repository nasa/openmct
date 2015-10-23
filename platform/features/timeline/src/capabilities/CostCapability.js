/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Exposes costs associated with a subsystem mode.
         * @constructor
         */
        function CostCapability(domainObject) {
            var model = domainObject.getModel();

            return {
                /**
                 * Get a list of resource types which have associated
                 * costs for this object. Returned values are machine-readable
                 * keys, and should be paired with external metadata for
                 * presentation (see category of extension `resources`).
                 * @returns {string[]} resource types
                 */
                resources: function () {
                    return Object.keys(model.resources || {}).sort();
                },
                /**
                 * Get the cost associated with a resource of an identified
                 * type (typically, one of the types reported from a
                 * `resources` call.)
                 * @param {string} key the resource type
                 * @returns {number} the associated cost
                 */
                cost: function (key) {
                    return (model.resources || {})[key] || 0;
                },
                /**
                 * Get an object containing key-value pairs describing
                 * resource utilization as described by this object.
                 * Keys are resource types; values are levels of associated
                 * resource utilization.
                 * @returns {object} resource utilizations
                 */
                invoke: function () {
                    return model.resources || {};
                }
            };
        }

        // Only applies to subsystem modes.
        CostCapability.appliesTo = function (model) {
            return (model || {}).type === 'mode';
        };

        return CostCapability;
    }
);
