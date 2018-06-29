/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * This bundle implements Browse mode.
 * @namespace platform/commonUI/browse
 */
define(
    ['lodash'],
    function (_) {

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
            objectService,
            navigationService,
            urlService,
            defaultPath
        ) {
            var initialPath = ($route.current.params.ids || defaultPath).split("/"),
                currentIds;

            $scope.treeModel = {
                selectedObject: undefined,
                onSelection: function (object) {
                    navigationService.setNavigation(object, true);
                },
                allowSelection: function (object) {
                    var domainObjectInView = navigationService.getNavigation(),
                        isInEditMode = domainObjectInView.getCapability('status').get('editing');

                    if (isInEditMode) {

                        var actions = object.getCapability('action'),
                            previewAction = actions.getActions({key: 'mct-preview-action'})[0];

                        if (previewAction && previewAction.perform) {
                            previewAction.perform();
                            return false;
                        } else {
                            return navigationService.shouldNavigate();
                        }

                    } else {
                        return true;
                    }
                }
            };

            function idsForObject(domainObject) {
                return urlService
                    .urlForLocation("", domainObject)
                    .replace('/', '');
            }

            // Find an object in an array of objects.
            function findObject(domainObjects, id) {
                var i;
                for (i = 0; i < domainObjects.length; i += 1) {
                    if (domainObjects[i].getId() === id) {
                        return domainObjects[i];
                    }
                }
            }

            // helper, fetch a single object from the object service.
            function getObject(id) {
                return objectService.getObjects([id])
                    .then(function (results) {
                        return results[id];
                    });
            }

            // recursively locate and return an object inside of a container
            // via a path.  If at any point in the recursion it fails to find
            // the next object, it will return the parent.
            function findViaComposition(containerObject, path) {
                var nextId = path.shift();
                if (!nextId) {
                    return containerObject;
                }
                return containerObject.useCapability('composition')
                    .then(function (composees) {
                        var nextObject = findObject(composees, nextId);
                        if (!nextObject) {
                            return containerObject;
                        }
                        if (!nextObject.hasCapability('composition')) {
                            return nextObject;
                        }
                        return findViaComposition(nextObject, path);
                    });
            }

            function navigateToObject(desiredObject) {
                $scope.navigatedObject = desiredObject;
                $scope.treeModel.selectedObject = desiredObject;
                currentIds = idsForObject(desiredObject);
                $route.current.pathParams.ids = currentIds;
                $location.path('/browse/' + currentIds);
            }

            function getLastChildIfRoot(object) {
                if (object.getId() !== 'ROOT') {
                    return object;
                }
                return object.useCapability('composition')
                    .then(function (composees) {
                        return composees[composees.length - 1];
                    });
            }

            function navigateToPath(path) {
                return getObject('ROOT')
                    .then(function (root) {
                        return findViaComposition(root, path);
                    })
                    .then(getLastChildIfRoot)
                    .then(function (object) {
                        navigationService.setNavigation(object);
                    });
            }

            getObject('ROOT')
                .then(function (root) {
                    $scope.domainObject = root;
                    navigateToPath(initialPath);
                });

            // Handle navigation events from view service.  Only navigates
            // if path has changed.
            function navigateDirectlyToModel(domainObject) {
                var newIds = idsForObject(domainObject);
                if (currentIds !== newIds) {
                    currentIds = newIds;
                    navigateToObject(domainObject);
                }
            }

            // Listen for changes in navigation state.
            navigationService.addListener(navigateDirectlyToModel);

            // Listen for route changes which are caused by browser events
            // (e.g. bookmarks to pages in OpenMCT) and prevent them.  Instead,
            // navigate to the path ourselves, which results in it being
            // properly set.
            $scope.$on('$routeChangeStart', function (event, route, oldRoute) {
                if (route.$$route === $route.current.$$route) {
                    if (route.pathParams.ids &&
                        route.pathParams.ids !== $route.current.pathParams.ids) {

                        var otherParams = _.omit(route.params, 'ids');
                        var oldOtherParams = _.omit(oldRoute.params, 'ids');
                        var deletedParams = _.omit(oldOtherParams, _.keys(otherParams));

                        event.preventDefault();

                        navigateToPath(route.pathParams.ids.split('/'))
                            .then(function () {
                                if (!_.isEqual(otherParams, oldOtherParams)) {
                                    _.forEach(otherParams, function (v, k) {
                                        $location.search(k, v);
                                    });
                                    _.forEach(deletedParams, function (k) {
                                        $location.search(k, null);
                                    });
                                }
                            });
                    } else {
                        navigateToPath([]);
                    }
                }
            });

            // Clean up when the scope is destroyed
            $scope.$on("$destroy", function () {
                navigationService.removeListener(navigateDirectlyToModel);
            });
        }

        return BrowseController;
    }
);

