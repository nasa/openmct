/*global define,Promise*/

/**
 * Module defining EditAction. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        // A no-op action to return in the event that the action cannot
        // be completed.
        var NULL_ACTION = {
            perform: function () {
                return undefined;
            }
        };

        /**
         * The Edit action is performed when the user wishes to enter Edit
         * mode (typically triggered by the Edit button.) This will
         * show the user interface for editing (by way of a change in
         * route)
         * @constructor
         */
        function EditAction($location, navigationService, $log, context) {
            var domainObject = (context || {}).domainObject;

            // We cannot enter Edit mode if we have no domain object to
            // edit, so verify that one was defined as part of the
            // context. (This is also verified in appliesTo, so this
            // would indicate abnormal behavior.)
            if (!domainObject) {
                $log.warn([
                    "No domain object to edit; ",
                    "edit action is not valid."
                ].join(""));

                return NULL_ACTION;
            }

            return {
                /**
                 * Enter edit mode.
                 */
                perform: function () {
                    navigationService.setNavigation(domainObject);
                    $location.path("/edit");
                }
            };
        }

        /**
         * Check for applicability; verify that a domain object is present
         * for this action to be performed upon.
         * @param {ActionContext} context the context in which this action
         *        will be performed; should contain a `domainObject` property
         */
        EditAction.appliesTo = function (context) {
            return (context || {}).domainObject !== undefined;
        };

        return EditAction;
    }
);