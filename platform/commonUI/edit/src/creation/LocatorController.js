/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
        function LocatorController($scope, $timeout, objectService, typeService, policyService, instantiate) {
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

                // Check if create new folder is a valid action for selected object
                $scope.validParent = function () {
                    if ($scope.treeModel.selectedObject) {
                        return policyService.allow(
                                "composition",
                                $scope.treeModel.selectedObject,
                                instantiate(typeService.getType('folder').getInitialModel())
                        );
                    } else {
                        return false;
                    }
                }
            }

            $scope.newFolderButtonClickHandler = function () {
                $scope.newFolderCreationTriggered = true;
            };

            $scope.newFolderCancelButtonClickHandler = function () {
                $scope.newFolderCreationTriggered = false;
                resetNewFolderNameInput();
            };

            // Get expected input pattern for folder name
            var folderNamePattern = new RegExp(
                typeService.getType('folder').getProperties()[0].propertyDefinition.pattern
            );

            // Validate folder name externally to avoid affecting overall form validation
            $scope.validFolderName = function () {
                return $scope.newFolderNameInput && folderNamePattern.test($scope.newFolderNameInput);
            };

            function selectAndScrollToNewFolder(newFolder) {
                $scope.treeModel.selectedObject = newFolder;
            }

            function resetNewFolderNameInput() {
                $scope.newFolderNameInput = "Unnamed Folder";
                $scope.newFolderCreationTriggered = false;
            }


            // Create new folder, update selection to new folder and reset new folder button
            $scope.newFolderCreateButtonClickHandler = function () {
                createNewFolderAction = $scope.treeModel.selectedObject.getCapability('action').getActions('create-new-folder')[0];
                createNewFolderAction.perform($scope.newFolderNameInput)
                                     .then(selectAndScrollToNewFolder)
                                     .then(resetNewFolderNameInput);
            };

            // Initial state for the tree's model
            $scope.treeModel = { selectedObject: $scope.ngModel[$scope.field] };

            //Initial values for new folder action
            $scope.newFolderNameInput = "Unnamed Folder";
            $scope.newFolderCreationTriggered = false;

            // Watch for changes from the tree
            $scope.$watch("treeModel.selectedObject", setLocatingObject);
        }

        return LocatorController;
    }
);

