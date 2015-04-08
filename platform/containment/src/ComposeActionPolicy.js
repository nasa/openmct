/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Restrict `compose` actions to cases where composition
         * is explicitly allowed.
         *
         * Note that this is a policy that needs the `policyService`,
         * since it's delegated to a different policy category.
         * To avoid a circular dependency, the service is obtained via
         * Angular's `$injector`.
         */
        function ComposeActionPolicy($injector) {
            var policyService;

            function allowComposition(containerObject, selectedObject) {
                // Get the object types involved in the compose action
                var containerType = containerObject &&
                        containerObject.getCapability('type'),
                    selectedType = selectedObject &&
                        selectedObject.getCapability('type');

                // Get a reference to the policy service if needed...
                policyService = policyService || $injector.get('policyService');

                // ...and delegate to the composition policy
                return policyService.allow(
                    'composition',
                    containerType,
                    selectedType
                );
            }

            return {
                /**
                 * Check whether or not a compose action should be allowed
                 * in this context.
                 * @returns {boolean} true if it may be allowed
                 */
                allow: function (candidate, context) {
                    if (candidate.getMetadata().key === 'compose') {
                        return allowComposition(
                            (context || {}).domainObject,
                            (context || {}).selectedObject
                        );
                    }
                    return true;
                }
            };
        }

        return ComposeActionPolicy;

    }
);