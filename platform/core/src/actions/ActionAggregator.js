/*global define,Promise*/

define(
    function () {
        "use strict";

        /**
         * An action service factory which aggregates
         * multiple other action services.
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
                getActions: getActions
            };
        }

        return ActionAggregator;
    }
);