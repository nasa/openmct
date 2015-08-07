/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Policy allowing composition only for domain object types which
         * have a composition property.
         * @constructor
         * @memberof platform/containment
         */
        function CompositionModelPolicy() {
            return {
                /**
                 * Is the type identified by the candidate allowed to
                 * contain the type described by the context?
                 * @memberof platform/containment.CompositionModelPolicy#
                 */
                allow: function (candidate, context) {
                    return Array.isArray(
                        (candidate.getInitialModel() || {}).composition
                    );
                }
            };
        }

        return CompositionModelPolicy;
    }
);
