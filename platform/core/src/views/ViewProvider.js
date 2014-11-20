/*global define,Promise*/

/**
 * Module defining ViewProvider. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ViewProvider(views) {

            function capabilitiesMatch(domainObject, capabilities, allowDelegation) {
                var delegation = domainObject.getCapability("delegation");

                allowDelegation = allowDelegation && (delegation !== undefined);

                function hasCapability(c) {
                    return domainObject.hasCapability(c) ||
                        (allowDelegation && delegation.doesDelegateCapability(c));
                }

                function and(a, b) {
                    return a && b;
                }

                return capabilities.map(hasCapability).reduce(and, true);
            }

            function getViews(domainObject) {
                var type = domainObject.useCapability("type");

                return views.filter(function (view) {
                    return (!view.type) || type.instanceOf(view.type);
                }).filter(function (view) {
                    return capabilitiesMatch(
                        domainObject,
                        view.needs || [],
                        view.delegation || false
                    );
                });
            }

            return {
                getViews: getViews
            };
        }

        return ViewProvider;
    }
);