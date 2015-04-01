/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Filters out views based on policy.
         * @param {PolicyService} policyService the service which provides
         *        policy decisions
         * @param {ViewService} viewService the service to decorate
         */
        function PolicyActionDecorator(policyService, viewService) {
            return {
                /**
                 * Get views which are applicable to this domain object.
                 * These will be filtered to remove any views which
                 * are deemed inapplicable by policy.
                 * @param {DomainObject} the domain object to view
                 * @returns {View[]} applicable views
                 */
                getViews: function (domainObject) {
                    // Check if an action is allowed by policy.
                    function allow(view) {
                        return policyService.allow('view', view, domainObject);
                    }

                    // Look up actions, filter out the disallowed ones.
                    return viewService.getViews(domainObject).filter(allow);
                }
            };
        }

        return PolicyActionDecorator;
    }
);