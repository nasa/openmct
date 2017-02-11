/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
/*global console*/

define(
    [],
    function () {

        /**
         * Controller for the "locator" control, which provides the
         * user with the ability to select a domain object as the
         * destination for a newly-created object in the Create menu.
         * @memberof platform/commonUI/browse
         * @constructor
         */
        function LocatorController($scope, $timeout, $q, objectService, typeService, policyService) {
            // Populate values needed by the locator control. These are:
            // * rootObject: The top-level object, since we want to show
            //               the full tree
            // * treeModel: The model for the embedded tree representation,
            //              used for bi-directional object selection.
            function setLocatingObject(domainObject, priorObject) {
                var context = domainObject &&
                    domainObject.getCapability("context"),
                    contextRoot = context && context.getRoot();

                if (contextRoot && contextRoot !== $scope.rootObject) {
                    $scope.rootObject = undefined;
                    // Update the displayed tree on a timeout to avoid
                    // an infinite digest exception.
                    $timeout(function () {
                        $scope.rootObject =
                            (context && context.getRoot()) || $scope.rootObject;
                    }, 0);
                } else if (!contextRoot && !$scope.rootObject) {
                    // Update the displayed tree on a timeout to avoid
                    // an infinite digest exception.
                    objectService.getObjects(['ROOT'])
                        .then(function (objects) {
                            $timeout(function () {
                                $scope.rootObject = objects.ROOT;
                            }, 0);
                        });
                }

                $scope.treeModel.selectedObject = domainObject;
                $scope.ngModel[$scope.field] = domainObject;

                // Restrict which locations can be selected
                if (domainObject &&
                    $scope.structure &&
                    $scope.structure.validate) {
                    if (!$scope.structure.validate(domainObject)) {
                        setLocatingObject(priorObject, undefined);
                        return;
                    }
                }

                // Set validity
                if ($scope.ngModelController) {
                    $scope.ngModelController.$setValidity(
                        'composition',
                        !!$scope.treeModel.selectedObject
                    );
                }

                $scope.canCreateNewFolder = policyService.allow(
                    "composition", 
                    typeService.getType($scope.treeModel.selectedObject.model.type), 
                    typeService.getType('folder'));
            }

            function createNewFolder(name, parent) {
                var folderType = typeService.getType('folder'),
                    newModel = folderType.getInitialModel(),
                    editorCapability;

                newModel.type = folderType.getKey();
                newModel.location = parent.getId();
                newModel.name = name;

                // Freezing so as to not allow interaction
                // while the new folder is being created.
                freezeDialog();
                instantiateAndPersistNewFolder(newModel, parent).then(function (newFolder) {
                    scrollToItem(newFolder);
                    unfreezeDialog();
                });
            }

            function instantiateAndPersistNewFolder(newModel, parent) {
                var newObject = parent.useCapability('instantiation', newModel);
                return newObject.getCapability('persistence').persist().then(function () {
                    parent.getCapability('composition').add(newObject);
                }).then(function () {
                    parent.getCapability('persistence').persist();
                    return newObject;
                });
            }

            function freezeDialog() {
                console.log("Freezing placeholder.");
            }

            function unfreezeDialog() {
                console.log("Unfreezing placeholder.");
            }

            function scrollToItem(treeItem) {
                console.log("Scrolling placeholder.");
            }

            $scope.newFolderFormData = {};
            $scope.newFolderCreationTriggered = false;

            $scope.newFolderButtonClickHandler = function () {
                $scope.newFolderCreationTriggered = true;
            };

            $scope.newFolderCancelButtonClickHandler = function () {
                $scope.newFolderCreationTriggered = false;
            };

            $scope.newFolderCreateButtonClickHandler = function () {
                if ($scope.canCreateNewFolder) {
                    createNewFolder($scope.newFolderFormData.name, $scope.treeModel.selectedObject);
                } else {
                    console.error("Attempted to create a new folder without being able to.");
                }
            };

            // Initial state for the tree's model
            $scope.treeModel = { selectedObject: $scope.ngModel[$scope.field] };

            // Watch for changes from the tree
            $scope.$watch("treeModel.selectedObject", setLocatingObject);
        }

        return LocatorController;
    }
);

