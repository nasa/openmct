/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller which support the Values view of Activity Modes.
         * @constructor
         * @param {Array} resources definitions for extensions of
         *        category `resources`
         */
        function ActivityModeValuesController(resources) {
            var metadata = {};

            // Store metadata for a specific resource type
            function storeMetadata(resource) {
                var key = (resource || {}).key;
                if (key) {
                    metadata[key] = resource;
                }
            }

            // Populate the lookup table to resource metadata
            resources.forEach(storeMetadata);

            return {
                /**
                 * Look up metadata associated with the specified
                 * resource type.
                 */
                metadata: function (key) {
                    return metadata[key];
                }
            };
        }

        return ActivityModeValuesController;
    }
);
