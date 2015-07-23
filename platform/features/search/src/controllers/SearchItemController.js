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
/*global define*/

/**
 * Module defining SearchItemController. Based on TreeNodeController.
 * Created by shale on 07/22/2015.
 */
define(function () {
    "use strict";
    
    function SearchItemController($scope) {
        var selectedObject = ($scope.ngModel || {}).selectedObject;//,
            //isSelected = false;
        
        /*
        // Consider the currently-navigated object and update
        // parameters which support display.
        function checkSelection() {
            var nodeObject = $scope.domainObject,
                navObject = selectedObject,
                nodeContext = nodeObject &&
                        nodeObject.getCapability('context'),
                navContext = navObject &&
                        navObject.getCapability('context'),
                nodePath,
                navPath;
                
            // Deselect; we will reselect below, iff we are
            // exactly at the end of the path.
            isSelected = false;

            // Expand if necessary (if the navigated object will
            // be in this node's subtree)
            if (nodeContext && navContext) {
                // Get the paths as arrays of identifiers
                nodePath = nodeContext.getPath().map(getId);
                navPath = navContext.getPath().map(getId);

                // Check to see if the node's path lies entirely
                // within the navigation path; otherwise, navigation
                // has happened in some other subtree.
                if (navPath.length >= nodePath.length &&
                        checkPath(nodePath, navPath)) {

                    // nodePath is along the navPath; if it's
                    // at the end of the path, highlight;
                    // otherwise, expand.
                    if (nodePath.length === navPath.length) {
                        isSelected = true;
                    } else { // node path is shorter: Expand!
                        if ($scope.toggle) {
                            $scope.toggle.setState(true);
                        }
                        trackExpansion();
                    }

                }
            }
        }
        */
            
        // Callback for the selection updates; track the currently
        // navigated object and update display parameters as needed.
        function setSelection(object) {
            selectedObject = object;
        }

        // Listen for changes which will effect display parameters
        $scope.$watch("ngModel.selectedObject", setSelection);
        //$scope.$watch("domainObject", checkSelection);

        return {
            /**
             * Check whether or not the domain object represented by
             * this tree node should be highlighted.
             * An object will be highlighted if it matches
             * ngModel.selectedObject
             * @returns true if this should be highlighted
             */
            isSelected: function () {
                // If this object is the same as the model's selected object
                return $scope.ngModel.selectedObject === $scope.domainObject;
            }
        };
    }
    return SearchItemController;
});
