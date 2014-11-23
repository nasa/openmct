/*global define,Promise*/

/**
 * Module defining BrowseController. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        var ROOT_OBJECT = "ROOT";

        /**
         *
         * @constructor
         */
        function BrowseController($scope, objectService, navigationService) {
            function setNavigation(domainObject) {
                $scope.navigatedObject = domainObject;
                //$scope.$apply("navigatedObject");
            }

            objectService.getObjects([ROOT_OBJECT]).then(function (objects) {
                var composition = objects[ROOT_OBJECT].useCapability("composition");
                $scope.domainObject = objects[ROOT_OBJECT];
                if (composition) {
                    composition.then(function (c) {
                        // Navigate to the last root level component (usually "mine")
                        if (!navigationService.getNavigation()) {
                            navigationService.setNavigation(c[c.length - 1]);
                        } else {
                            $scope.navigatedObject = navigationService.getNavigation();
                        }
                    });
                }
            });

            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });

            navigationService.addListener(setNavigation);

            return {
                setNavigation: function (domainObject) {
                    navigationService.setNavigation(domainObject);
                }
            };
        }

        return BrowseController;
    }
);