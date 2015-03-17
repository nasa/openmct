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
        function EditController($scope, navigationService) {
            var navigatedObject;

            function setNavigation(domainObject) {
                // Wrap the domain object such that all mutation is
                // confined to edit mode (until Save)
                navigatedObject =
                    domainObject && new EditableDomainObject(domainObject);
            }

            setNavigation(navigationService.getNavigation());
            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });

            return {
                navigatedObject: function () {
                    return navigatedObject;
                },
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