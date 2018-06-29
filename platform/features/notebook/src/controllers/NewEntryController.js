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

/**
 * Module defining NewEntryController. */
define(
    [],
    function () {

        function NewEntryController($scope,$rootScope) {

            $scope.snapshot = undefined;
            $scope.snapToggle = true;
            $scope.entryText = '';
            var annotateAction = $rootScope.selObj.getCapability('action').getActions(
                                                                            {category: 'embed'})[1];

            $scope.$parent.$parent.ngModel[$scope.$parent.$parent.field] = $rootScope.selObj;
            $scope.objectName = $rootScope.selObj.getModel().name;
            $scope.cssClass = $rootScope.selObj.getCapability('type').typeDef.cssClass;

            $scope.annotateSnapshot = function ($event) {
                if ($rootScope.currentDialog.value) {
                    $rootScope.newEntryText = $scope.$parent.$parent.ngModel.entry;
                    $rootScope.currentDialog.cancel();
                    annotateAction.perform($event, $rootScope.snapshot.src);
                    $rootScope.currentDialog = undefined;
                }
            };

            function updateSnapshot(img) {
                $scope.snapshot = img;
            }
            // Update set of actions whenever the action capability
            // changes or becomes available.
            $rootScope.$watch("snapshot", updateSnapshot);

            $rootScope.$watch("selValue", toggleEmbed);

            function toggleEmbed(value) {
                $scope.snapToggle = value;
            }
        }

        return NewEntryController;
    }
);
