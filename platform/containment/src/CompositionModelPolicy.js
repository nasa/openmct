
define(
    [],
    () => {

        /**
         * Policy allowing composition only for domain object types which
         * have a composition property.
         * @constructor
         * @memberof platform/containment
         * @implements {Policy.<Type, Type>}
         */
        class CompositionModelPolicy {

        allow(candidate) {
            return Array.isArray(
                (candidate.getInitialModel() || {}).composition
            );
        };
      }
        return CompositionModelPolicy;
    }
);
