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
         * @implements {Policy.<Type, Type>}
         */
        function CompositionModelPolicy() {
        }

        CompositionModelPolicy.prototype.allow = function (candidate, context) {
            return Array.isArray(
                (candidate.getInitialModel() || {}).composition
            );
        };

        return CompositionModelPolicy;
    }
);
