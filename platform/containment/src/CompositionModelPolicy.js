
define(
    [],
    function () {

        /**
         * Policy allowing composition only for domain object types which
         * have a composition property.
         * @constructor
         * @memberof platform/containment
         * @implements {Policy.<Type, Type>}
         */
        function CompositionModelPolicy() {
        }

        CompositionModelPolicy.prototype.allow = function (candidate) {
            var candidateType = candidate.getCapability('type');

            return Array.isArray(
                (candidateType.getInitialModel() || {}).composition
            );
        };

        return CompositionModelPolicy;
    }
);
