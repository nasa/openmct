/*global define*/


define(
    [],
    function () {
        "use strict";

        /**
         * Build a table indicating which types are expected to expose
         * which capabilities. This supports composition policy (rules
         * for which objects can contain which other objects) which
         * sometimes is determined based on the presence of capabilities.
         */
        function CapabilityTable(typeService, capabilityService) {
            var table = {};

            // Build an initial model for a type
            function buildModel(type) {
                var model = Object.create(type.getInitialModel() || {});
                model.type = type.getKey();
                return model;
            }

            // Get capabilities expected for this type
            function getCapabilities(type) {
                return capabilityService.getCapabilities(buildModel(type));
            }

            // Populate the lookup table for this type's capabilities
            function addToTable(type) {
                var typeKey = type.getKey();
                Object.keys(getCapabilities(type)).forEach(function (key) {
                    table[key] = table[key] || {};
                    table[key][typeKey] = true;
                });
            }

            // Build the table
            (typeService.listTypes() || []).forEach(addToTable);

            return {
                /**
                 * Check if a type is expected to expose a specific
                 * capability.
                 */
                hasCapability: function (typeKey, capabilityKey) {
                    return (table[capabilityKey] || {})[typeKey];
                }
            };
        }

        return CapabilityTable;
    }
);