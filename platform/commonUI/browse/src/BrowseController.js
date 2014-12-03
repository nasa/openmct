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
         * The BrowseController is used to populate the initial scope in Browse
         * mode. It loads the root object from the objectService and makes it
         * available in the scope for Angular template's; this is the point at
         * which Angular templates first have access to the domain object
         * hierarchy.
         *
         * @constructor
         */
        function BrowseController($scope, objectService, navigationService) {
            // Callback for updating the in-scope reference to the object
            // that is currently navigated-to.
            function setNavigation(domainObject) {
                $scope.navigatedObject = domainObject;
                $scope.treeModel.selectedObject = domainObject;
            }

            // Load the root object, put it in the scope.
            // Also, load its immediate children, and (possibly)
            // navigate to one of them, so that navigation state has
            // a useful initial value.
            objectService.getObjects([ROOT_OBJECT]).then(function (objects) {
                var composition = objects[ROOT_OBJECT].useCapability("composition");
                $scope.domainObject = objects[ROOT_OBJECT];
                if (composition) {
                    composition.then(function (c) {
                        // Check if an object has been navigated-to already...
                        if (!navigationService.getNavigation()) {
                            // If not, pick a default as the last
                            // root-level component (usually "mine")
                            navigationService.setNavigation(c[c.length - 1]);
                        } else {
                            // Otherwise, just expose it in the scope
                            $scope.navigatedObject = navigationService.getNavigation();
                        }
                    });
                }
            });

            // Provide a model for the tree to modify
            $scope.treeModel = {
                selectedObject: navigationService.getNavigation()
            };

            // Listen for changes in navigation state.
            navigationService.addListener(setNavigation);

            // Also listen for changes which come from the tree
            $scope.$watch("treeModel.selectedObject", setNavigation);

            // Clean up when the scope is destroyed
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });

        }

        return BrowseController;
    }
);