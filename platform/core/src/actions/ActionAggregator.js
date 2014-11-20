/*global define,Promise*/

define(
    function () {
        "use strict";

        /**
         * The ActionAggregator makes several actionService
         * instances act as those they were one. When requesting
         * actions for a given context, results from all
         * services will be assembled and concatenated.
         *
         * @constructor
         * @param {ActionProvider[]} actionProviders an array
         *        of action services
         */
        function ActionAggregator(actionProviders) {

            function getActions(context) {
                // Get all actions from all providers, reduce down
                // to one array by concatenation
                return actionProviders.map(function (provider) {
                    return provider.getActions(context);
                }).reduce(function (a, b) {
                    return a.concat(b);
                }, []);
            }

            return {
                /**
                 * Get a list of actions which are valid in a given
                 * context.
                 *
                 * @param {ActionContext} the context in which
                 *        the action will occur; this is a
                 *        JavaScript object containing key-value
                 *        pairs. Typically, this will contain a
                 *        field "domainObject" which refers to
                 *        the domain object that will be acted
                 *        upon, but may contain arbitrary information
                 *        recognized by specific providers.
                 * @return {Action[]} an array of actions which
                 *        may be performed in the provided context.
                 *
                 * @method
                 * @memberof ActionAggregator
                 */
                getActions: getActions
            };
        }

        return ActionAggregator;
    }
);