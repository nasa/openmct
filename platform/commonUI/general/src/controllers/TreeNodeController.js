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
 * Module defining TreeNodeController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The TreeNodeController supports the tree node representation;
         * a tree node has a label for the current object as well as a
         * subtree which shows (and is not loaded until) the node is
         * expanded.
         *
         * This controller tracks the following, so that the tree node
         * template may update its state accordingly:
         *
         * * Whether or not the tree node has ever been expanded (this
         *   is used to lazily load, exactly once, the subtree)
         * * Whether or not the node is currently the domain object
         *   of navigation (this gets highlighted differently to
         *   provide the user with visual feedback.)
         *
         * Additionally, this controller will automatically trigger
         * node expansion when this tree node's _subtree_ will contain
         * the navigated object (recursively, this becomes an
         * expand-to-show-navigated-object behavior.)
         * @constructor
         */
        function TreeNodeController($scope, $timeout, $rootScope, queryService) {
            var selectedObject = ($scope.ngModel || {}).selectedObject,
                isSelected = false,
                hasBeenExpanded = false;

            // Look up the id for a domain object. A convenience
            // for mapping; additionally does some undefined-checking.
            function getId(obj) {
                return obj && obj.getId && obj.getId();
            }

            // Verify that id paths are equivalent, staring at
            // index, ending at the end of the node path.
            function checkPath(nodePath, navPath, index) {
                index = index || 0;

                // The paths overlap if we have made it past the
                // end of the node's path; otherwise, check the
                // id at the current index for equality and perform
                // a recursive step for subsequent ids in the paths,
                // until we exceed path length or hit a mismatch.
                return (index >= nodePath.length) ||
                        ((navPath[index] === nodePath[index]) &&
                                checkPath(nodePath, navPath, index + 1));
            }

            // Track that a node has been expanded, either by the
            // user or automatically to show a selection.
            function trackExpansion() {
                if (!hasBeenExpanded) {
                    // Run on a timeout; if a lot of expansion needs to
                    // occur (e.g. if the selection is several nodes deep) we
                    // want this to be spread across multiple digest cycles.
                    $timeout(function () { hasBeenExpanded = true; }, 0);
                }
            }
            
            function checkMobile() {
                return queryService.isMobile(navigator.userAgent);
            }
            
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

            // Callback for the selection updates; track the currently
            // navigated object and update display parameters as needed.
            function setSelection(object) {
                selectedObject = object;
                checkSelection();
            }
            
            // Listen for changes which will effect display parameters
            $scope.$watch("ngModel.selectedObject", setSelection);
            $scope.$watch("domainObject", checkSelection);

            return {
                /**
                 * This method should be called when a node is expanded
                 * to record that this has occurred, to support one-time
                 * lazy loading of the node's subtree.
                 */
                trackExpansion: trackExpansion,
                
                checkMobile: checkMobile,
                
                /**
                 * Check if this not has ever been expanded.
                 * @returns true if it has been expanded
                 */
                hasBeenExpanded: function () {
                    return hasBeenExpanded;
                },
                /**
                 * Check whether or not the domain object represented by
                 * this tree node should be highlighted.
                 * An object will be highlighted if it matches
                 * ngModel.selectedObject
                 * @returns true if this should be highlighted
                 */
                isSelected: function () {
                    return isSelected;
                }
            };
        }

        return TreeNodeController;
    }
);