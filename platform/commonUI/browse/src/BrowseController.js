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
/*global define,Promise, confirm*/

/**
 * This bundle implements Browse mode.
 * @namespace platform/commonUI/browse
 */
define(
    [
        '../../../representation/src/gestures/GestureConstants'
    ],
    function (GestureConstants) {
        "use strict";

        var ROOT_ID = "ROOT";

        /**
         * The BrowseController is used to populate the initial scope in Browse
         * mode. It loads the root object from the objectService and makes it
         * available in the scope for Angular template's; this is the point at
         * which Angular templates first have access to the domain object
         * hierarchy.
         *
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function BrowseController(
            $scope, 
            $route, 
            $location, 
            $window, 
            objectService, 
            navigationService, 
            urlService, 
            policyService,
            defaultPath
        ) {
            var path = [ROOT_ID].concat(
                ($route.current.params.ids || defaultPath).split("/")
            );

            function updateRoute(domainObject) {
                var priorRoute = $route.current,
                    // Act as if params HADN'T changed to avoid page reload
                    unlisten;

                unlisten = $scope.$on('$locationChangeSuccess', function () {
                    // Checks path to make sure /browse/ is at front
                    // if so, change $route.current
                    if ($location.path().indexOf("/browse/") === 0) {
                        $route.current = priorRoute;
                    }
                    unlisten();
                });
                // urlService.urlForLocation used to adjust current
                // path to new, addressed, path based on
                // domainObject
                $location.path(urlService.urlForLocation("browse", domainObject));

            }

            // Callback for updating the in-scope reference to the object
            // that is currently navigated-to.
            function setNavigation(domainObject) {
                var navigationAllowed = true;

                if (domainObject === $scope.navigatedObject){
                    //do nothing;
                    return;
                }

                policyService.allow("navigation", $scope.navigatedObject, domainObject, function(message){
                    navigationAllowed = $window.confirm(message + "\r\n\r\n" +
                        " Are you sure you want to continue?");
                });

                if (navigationAllowed) {
                    $scope.navigatedObject = domainObject;
                    $scope.treeModel.selectedObject = domainObject;
                    navigationService.setNavigation(domainObject);
                    updateRoute(domainObject);
                } else {
                    //If navigation was unsuccessful (ie. blocked), reset
                    // the selected object in the tree to the currently
                    // navigated object
                    $scope.treeModel.selectedObject = $scope.navigatedObject ;
                }
            }

            function navigateTo(domainObject) {

                // Check if an object has been navigated-to already...
                // If not, or if an ID path has been explicitly set in the URL,
                // navigate to the URL-specified object.
                if (!navigationService.getNavigation() || $route.current.params.ids) {
                    // If not, pick a default as the last
                    // root-level component (usually "mine")
                    navigationService.setNavigation(domainObject);
                    $scope.navigatedObject = domainObject;
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
                        if (nextObject) {
                            if (index + 1 >= path.length) {
                                navigateTo(nextObject);
                            } else {
                                doNavigate(nextObject, index + 1);
                            }
                        } else if (index === 1 && c.length > 0) {
                            // Roots are in a top-level container that we don't
                            // want to be selected, so if we couldn't find an
                            // object at the path we wanted, at least select
                            // one of its children.
                            navigateTo(c[c.length - 1]);
                        } else {
                            // Couldn't find the next element of the path
                            // so navigate to the last path object we did find
                            navigateTo(domainObject);
                        }
                    });
                } else {
                    // Similar to above case; this object has no composition,
                    // so navigate to it instead of subsequent path elements.
                    navigateTo(domainObject);
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

            // Also listen for changes which come from the tree. Changes in
            // the tree will trigger a change in browse navigation state.
            $scope.$watch("treeModel.selectedObject", setNavigation);

            // Clean up when the scope is destroyed
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
        }

        return BrowseController;
    }
);

