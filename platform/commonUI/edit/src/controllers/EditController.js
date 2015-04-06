/*global define,Promise*/

/**
 * Module defining EditController. Created by vwoeltje on 11/14/14.
 */
define(
    ["../objects/EditableDomainObject"],
    function (EditableDomainObject) {
        "use strict";

        /**
         * Controller which is responsible for populating the scope for
         * Edit mode; introduces an editable version of the currently
         * navigated domain object into the scope.
         * @constructor
         */
        function EditController($scope, $q, navigationService) {
            var navigatedObject;

            function setNavigation(domainObject) {
                // Wrap the domain object such that all mutation is
                // confined to edit mode (until Save)
                navigatedObject =
                    domainObject && new EditableDomainObject(domainObject, $q);
            }

            setNavigation(navigationService.getNavigation());
            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });

            return {
                /**
                 * Get the domain object which is navigated-to.
                 * @returns {DomainObject} the domain object that is navigated-to
                 */
                navigatedObject: function () {
                    return navigatedObject;
                },
                /**
                 * Get the warning to show if the user attempts to navigate
                 * away from Edit mode while unsaved changes are present.
                 * @returns {string} the warning to show, or undefined if
                 *          there are no unsaved changes
                 */
                getUnloadWarning: function () {
                    var editorCapability = navigatedObject &&
                            navigatedObject.getCapability("editor"),
                        hasChanges = editorCapability && editorCapability.dirty();

                    return hasChanges ?
                            "Unsaved changes will be lost if you leave this page." :
                            undefined;
                }
            };
        }

        return EditController;
    }
);