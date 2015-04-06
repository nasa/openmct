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
            function setNavigation(domainObject) {
                // Wrap the domain object such that all mutation is
                // confined to edit mode (until Save)
                $scope.navigatedObject =
                    domainObject && new EditableDomainObject(domainObject, $q);
            }

            setNavigation(navigationService.getNavigation());
            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
        }

        return EditController;
    }
);