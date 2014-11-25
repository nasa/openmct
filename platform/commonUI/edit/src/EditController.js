/*global define,Promise*/

/**
 * Module defining EditController. Created by vwoeltje on 11/14/14.
 */
define(
    ["./objects/EditableDomainObject"],
    function (EditableDomainObject) {
        "use strict";

        /**
         *
         * @constructor
         */
        function EditController($scope, navigationService) {
            function setNavigation(domainObject) {
                $scope.navigatedObject =
                    domainObject && new EditableDomainObject(domainObject);
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