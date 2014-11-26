/*global define,Promise*/

/**
 * Module defining NavigateAction. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The navigate action navigates to a specific domain object.
         * @constructor
         */
        function NavigateAction(navigationService, $q, context) {
            var domainObject = context.domainObject;

            function perform() {
                // Set navigation, and wrap like a promise
                return $q.when(navigationService.setNavigation(domainObject));
            }

            return {
                /**
                 * Navigate to the object described in the context.
                 * @returns {Promise} a promise that is resolved once the
                 *          navigation has been updated
                 */
                perform: perform
            };
        }

        /**
         * Navigate as an action is only applicable when a domain object
         * is described in the action context.
         * @param {ActionContext} context the context in which the action
         *        will be performed
         * @returns true if applicable
         */
        NavigateAction.appliesTo = function (context) {
            return context.domainObject !== undefined;
        };

        return NavigateAction;
    }
);