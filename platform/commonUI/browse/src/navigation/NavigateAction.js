/*global define,Promise*/

/**
 * Module defining NavigateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function NavigateAction(navigationService, context) {
            var domainObject = context.domainObject;

            function perform() {
                return Promise.resolve(
                    navigationService.setNavigation(domainObject)
                );
            }

            return {
                perform: perform
            };
        }

        NavigateAction.appliesTo = function (context) {
            return context.domainObject !== undefined;
        };

        return NavigateAction;
    }
);