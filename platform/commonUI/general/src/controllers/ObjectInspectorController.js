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
 * Module defining ObjectInspectorController. Created by shale on 08/21/2015.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The ObjectInspectorController gets and formats the data for 
         *  the inspector display
         *
         * @constructor
         */
        function ObjectInspectorController($scope, objectService) {
            $scope.primaryParents = [];
            $scope.contextutalParents = [];
            
            // Gets an array of the contextual parents/anscestors of the (first) inspected object
            function getContextualPath() {
                var currentObj,
                    currentParent,
                    parents = [];
                
                if ($scope.ngModel && $scope.ngModel.inspectionObjects && $scope.ngModel.inspectionObjects[0]) {
                    currentObj = $scope.ngModel.inspectionObjects[0];
                } else {
                    // Fallback for if the inspection objects are not defined is the selected object
                    currentObj = $scope.ngModel && $scope.ngModel.selectedObject;
                }
                
                currentParent = currentObj &&
                    currentObj.hasCapability('context') &&
                    currentObj.getCapability('context').getParent();
                
                // Loop while this has a parent that is not the root object 
                while (currentParent && currentParent.getModel().type !== 'root' &&
                        currentParent.hasCapability('context')) {
                    // Record this object 
                    parents.unshift(currentParent);
                    
                    // Get the next one up the tree 
                    currentObj = currentParent;
                    currentParent = currentObj.getCapability('context').getParent();
                }
                
                $scope.contextutalParents = parents;
            }
            
            // Gets an array of the parents/anscestors of the (first) inspected object's 
            //   primary location (locational of original non-link)
            function getPrimaryPath(current) {
                var location;
                
                // If this the the initial call of this recursive function
                if (!current) {
                    // Set the object we are looking at
                    if ($scope.ngModel && $scope.ngModel.inspectionObjects && $scope.ngModel.inspectionObjects[0]) {
                        current = $scope.ngModel.inspectionObjects[0];
                    } else {
                        // Fallback for if the inspection objects are not defined is the selected object
                        current = $scope.ngModel && $scope.ngModel.selectedObject;
                    }
                    
                    // And reset the parents array 
                    $scope.primaryParents = [];
                }
                
                location = current.getModel().location;
                
                if (location && location !== 'root') {
                    objectService.getObjects([location]).then(function (obj) {
                        var next = obj[location];
                        
                        $scope.primaryParents.unshift(next);
                        getPrimaryPath(next);
                    });
                }
            }
            
            // Gets the metadata for the selected object
            function getMetadata() {
                if ($scope.ngModel &&
                        $scope.ngModel.inspectionObjects &&
                        $scope.ngModel.inspectionObjects[0] &&
                        $scope.ngModel.inspectionObjects[0].hasCapability('metadata')) {
                    // Get metadata from the inspected object
                    $scope.metadata = $scope.ngModel.inspectionObjects[0].useCapability('metadata');
                } else {
                    // Fallback for if the inspection objects are not defined is the selected object
                    $scope.metadata = $scope.ngModel && $scope.ngModel.selectedObject &&
                        $scope.ngModel.selectedObject.hasCapability('metadata') &&
                        $scope.ngModel.selectedObject.useCapability('metadata');
                }
            }
            
            $scope.$watch('ngModel.inspectionObjects', function () {
                var isLink;
                
                if ($scope && $scope.ngModel &&
                        $scope.ngModel.inspectionObjects &&
                        $scope.ngModel.inspectionObjects[0]) {
                    isLink = $scope.ngModel.inspectionObjects[0].hasCapability('location') &&
                        $scope.ngModel.inspectionObjects[0].getCapability('location').isLink();
                } else {
                    // Fallback for if the inspection objects are not defined is the selected object
                    isLink = $scope && $scope.ngModel &&
                        $scope.ngModel.selectedObject &&
                        $scope.ngModel.selectedObject.hasCapability('location') &&
                        $scope.ngModel.selectedObject.getCapability('location').isLink();
                }
                
                
                if (isLink) {
                    getPrimaryPath();
                    getContextualPath();
                } else {
                    $scope.primaryParents = [];
                    getContextualPath();
                }
                
                getMetadata();
            });
        }

        return ObjectInspectorController;
    }
);