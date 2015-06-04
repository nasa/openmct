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

define(
    [],
    function () {
        "use strict";

        var ROOT_ID = "ROOT";

        /**
         * Controller for the domain object selector control.
         * @constructor
         * @param {ObjectService} objectService service from which to
         *        read domain objects
         * @param $scope Angular scope for this controller
         */
        function SelectorController(objectService, $scope) {
            var treeModel = {},
                listModel = {},
                selectedObjects = [],
                rootObject,
                previousSelected;

            // For watch; look at the user's selection in the tree
            function getTreeSelection() {
                return treeModel.selectedObject;
            }

            // Get the value of the field being edited
            function getField() {
                return $scope.ngModel[$scope.field] || [];
            }

            // Get the value of the field being edited
            function setField(value) {
                $scope.ngModel[$scope.field] = value;
            }

            // Store root object for subsequent exposure to template
            function storeRoot(objects) {
                rootObject = objects[ROOT_ID];
            }

            // Check that a selection is of the valid type
            function validateTreeSelection(selectedObject) {
                var type = selectedObject &&
                    selectedObject.getCapability('type');

                // Delegate type-checking to the capability...
                if (!type || !type.instanceOf($scope.structure.type)) {
                    treeModel.selectedObject = previousSelected;
                }

                // Track current selection to restore it if an invalid
                // selection is made later.
                previousSelected = treeModel.selectedObject;
            }

            // Update the right-hand list of currently-selected objects
            function updateList(ids) {
                function updateSelectedObjects(objects) {
                    // Look up from the
                    function getObject(id) { return objects[id]; }
                    selectedObjects = ids.filter(getObject).map(getObject);
                }

                // Look up objects by id, then populate right-hand list
                objectService.getObjects(ids).then(updateSelectedObjects);
            }

            // Reject attempts to select objects of the wrong type
            $scope.$watch(getTreeSelection, validateTreeSelection);

            // Make sure right-hand list matches underlying model
            $scope.$watchCollection(getField, updateList);

            // Look up root object, then store it
            objectService.getObjects([ROOT_ID]).then(storeRoot);

            return {
                /**
                 * Get the root object to show in the left-hand tree.
                 * @returns {DomainObject} the root object
                 */
                root: function () {
                    return rootObject;
                },
                /**
                 * Add a domain object to the list of selected objects.
                 * @param {DomainObject} the domain object to select
                 */
                select: function (domainObject) {
                    var id = domainObject && domainObject.getId(),
                        list = getField() || [];
                    // Only select if we have a valid id,
                    // and it isn't already selected
                    if (id && list.indexOf(id) === -1) {
                        setField(list.concat([id]));
                    }
                },
                /**
                 * Remove a domain object from the list of selected objects.
                 * @param {DomainObject} the domain object to select
                 */
                deselect: function (domainObject) {
                    var id = domainObject && domainObject.getId(),
                        list = getField() || [];
                    // Only change if this was a valid id,
                    // for an object which was already selected
                    if (id && list.indexOf(id) !== -1) {
                        // Filter it out of the current field
                        setField(list.filter(function (otherId) {
                            return otherId !== id;
                        }));
                        // Clear the current list selection
                        delete listModel.selectedObject;
                    }
                },
                /**
                 * Get the currently-selected domain objects.
                 * @returns {DomainObject[]} the current selection
                 */
                selected: function () {
                    return selectedObjects;
                },
                // Expose tree/list model for use in template directly
                treeModel: treeModel,
                listModel: listModel
            };
        }


        return SelectorController;
    }
);