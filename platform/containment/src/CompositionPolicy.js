/*global define*/

define(
    ['./ContainmentTable'],
    function (ContainmentTable) {
        "use strict";

        /**
         * Defines composition policy as driven by type metadata.
         */
        function CompositionPolicy($injector) {
            // We're really just wrapping the containment table and rephrasing
            // it as a policy decision.
            var table;

            function getTable() {
                return (table = table || new ContainmentTable(
                    $injector.get('typeService'),
                    $injector.get('capabilityService')
                ));
            }

            return {
                /**
                 * Is the type identified by the candidate allowed to
                 * contain the type described by the context?
                 */
                allow: function (candidate, context) {
                    return getTable().canContain(candidate, context);
                }
            };
        }

        return CompositionPolicy;
    }
);