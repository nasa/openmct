/*global define,Promise*/

/**
 * Module defining EditAction. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        var NULL_ACTION = {
            perform: function () {
                return undefined;
            }
        };

        /**
         *
         * @constructor
         */
        function EditAction($location, navigationService, $log, context) {
            var domainObject = (context || {}).domainObject;

            if (!domainObject) {
                $log.warn([
                    "No domain object to edit; ",
                    "edit action is not valid."
                ].join(""));

                return NULL_ACTION;
            }

            return {
                perform: function () {
                    navigationService.setNavigation(domainObject);
                    $location.path("/edit");
                }
            };
        }

        EditAction.appliesTo = function (context) {
            return (context || {}).domainObject !== undefined;
        };

        return EditAction;
    }
);