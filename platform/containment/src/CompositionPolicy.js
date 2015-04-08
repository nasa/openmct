/*global define*/

define(
    ['./ContainmentTable'],
    function (ContainmentTable) {
        "use strict";

        /**
         * Defines composition policy as driven by type metadata.
         */
        function CompositionPolicy(typeService, capabilityService) {
            // We're really just wrapping the containment table and rephrasing
            // it as a policy decision.
            var table = new ContainmentTable(typeService, capabilityService);

            return {
                /**
                 * Is the type identified by the candidate allowed to
                 * contain the type described by the context?
                 */
                allow: function (candidate, context) {
                    return table.canContain(candidate, context);
                }
            };
        }

        return CompositionPolicy;
    }
);