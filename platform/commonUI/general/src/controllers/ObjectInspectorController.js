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
            //$scope.isLink = false;
            
            // Gets an array of the contextual parents/anscestors of the selected object
            function getContextualPath() {
                var currentObj = $scope.ngModel.selectedObject,
                    currentParent,
                    parents = [];
                
                currentParent = currentObj &&
                    currentObj.hasCapability('context') &&
                    currentObj.getCapability('context').getParent();
                
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
            
            // Gets an array of the parents/anscestors of the selected object's 
            //   primary location (locational of original non-link)
            function getPrimaryPath(current) {
                var location;
                
                // If this the the initial call of this recursive function
                if (!current) {
                    current = $scope.ngModel.selectedObject;
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
                $scope.metadata = $scope.ngModel.selectedObject &&
                    $scope.ngModel.selectedObject.hasCapability('metadata') &&
                    $scope.ngModel.selectedObject.useCapability('metadata');
            }
            
            // Set scope variables when the selected object changes 
            $scope.$watch('ngModel.selectedObject', function () {
                $scope.isLink = $scope.ngModel.selectedObject &&
                    $scope.ngModel.selectedObject.hasCapability('location') &&
                    $scope.ngModel.selectedObject.getCapability('location').isLink();
                
                if ($scope.isLink) {
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