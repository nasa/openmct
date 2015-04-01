/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Filters out actions based on policy.
         * @param {PolicyService} policyService the service which provides
         *        policy decisions
         * @param {ActionService} actionService the service to decorate
         */
        function PolicyActionDecorator(policyService, actionService) {
            return {
                /**
                 * Get actions which are applicable in this context.
                 * These will be filters to remove any actions which
                 * are deemed inapplicable by policy.
                 * @param context the context in which the action will occur
                 * @returns {Action[]} applicable actions
                 */
                getActions: function (context) {
                    // Check if an action is allowed by policy.
                    function allow(action) {
                        return policyService.allow('action', action, context);
                    }

                    // Look up actions, filter out the disallowed ones.
                    return actionService.getActions(context).filter(allow);
                }
            };
        }

        return PolicyActionDecorator;
    }
);