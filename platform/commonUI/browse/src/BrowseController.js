/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

/**
 * Module defining BrowseController. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        var ROOT_ID = "ROOT",
            DEFAULT_PATH = "mine";

        /**
         * The BrowseController is used to populate the initial scope in Browse
         * mode. It loads the root object from the objectService and makes it
         * available in the scope for Angular template's; this is the point at
         * which Angular templates first have access to the domain object
         * hierarchy.
         *
         * @constructor
         */
        function BrowseController($scope, $route, $location, objectService, navigationService) {
            var path = [ROOT_ID].concat(
                ($route.current.params.ids || DEFAULT_PATH).split("/")
            );

            function updateRoute(domainObject) {
                var context = domainObject.getCapability('context'),
                    objectPath = context.getPath(),
                    ids = objectPath.map(function (domainObject) {
                        return domainObject.getId();
                    }),
                    priorRoute = $route.current,
                    // Act as if params HADN'T changed to avoid page reload
                    unlisten = $scope.$on('$locationChangeSuccess', function () {
                        $route.current = priorRoute;
                        unlisten();
                    });

                $location.path("/browse/" + ids.slice(1).join("/"));
            }

            // Callback for updating the in-scope reference to the object
            // that is currently navigated-to.
            function setNavigation(domainObject) {
                $scope.navigatedObject = domainObject;
                $scope.treeModel.selectedObject = domainObject;
                navigationService.setNavigation(domainObject);
                updateRoute(domainObject);
            }

            function navigateTo(domainObject) {
                // Check if an object has been navigated-to already...
                // If not, or if an ID path has been explicitly set in the URL,
                // navigate to the URL-specified object.
                if (!navigationService.getNavigation() || $route.current.params.ids) {
                    // If not, pick a default as the last
                    // root-level component (usually "mine")
                    navigationService.setNavigation(domainObject);
                } else {
                    // Otherwise, just expose the currently navigated object.
                    $scope.navigatedObject = navigationService.getNavigation();
                    updateRoute($scope.navigatedObject);
                }
            }

            function findObject(domainObjects, id) {
                var i;
                for (i = 0; i < domainObjects.length; i += 1) {
                    if (domainObjects[i].getId() === id) {
                        return domainObjects[i];
                    }
                }
            }

            // Navigate to the domain object identified by path[index],
            // which we expect to find in the composition of the passed
            // domain object.
            function doNavigate(domainObject, index) {
                var composition = domainObject.useCapability("composition");
                if (composition) {
                    composition.then(function (c) {
                        var nextObject = findObject(c, path[index]);
                        if (index + 1 >= path.length) {
                            navigateTo(nextObject);
                        } else {
                            doNavigate(nextObject, index + 1);
                        }
                    });
                }
            }

            // Load the root object, put it in the scope.
            // Also, load its immediate children, and (possibly)
            // navigate to one of them, so that navigation state has
            // a useful initial value.
            objectService.getObjects([path[0]]).then(function (objects) {
                $scope.domainObject = objects[path[0]];
                doNavigate($scope.domainObject, 1);
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
