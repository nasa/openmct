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

define(
    [],
    () => {

        const ROOT_ID = "ROOT";

        /**
         * Controller for the domain object selector control.
         * @memberof platform/commonUI/general
         * @constructor
         * @param {ObjectService} objectService service from which to
         *        read domain objects
         * @param $scope Angular scope for this controller
         */
        class SelectorController {
          constructor(objectService, $scope) {
            let treeModel = {},
                listModel = {},
                previousSelected

            // For watch; look at the user's selection in the tree
            const getTreeSelection = () => {
                return treeModel.selectedObject;
            };

            // Store root object for subsequent exposure to template
            const storeRoot = (objects) => {
                this.rootObject = objects[ROOT_ID];
            };

            // Check that a selection is of the valid type
            const validateTreeSelection = (selectedObject) => {
                let type = selectedObject &&
                    selectedObject.getCapability('type');

                // Delegate type-checking to the capability...
                if (!type || !type.instanceOf($scope.structure.type)) {
                    treeModel.selectedObject = previousSelected;
                }

                // Track current selection to restore it if an invalid
                // selection is made later.
                previousSelected = treeModel.selectedObject;
            };

            // Update the right-hand list of currently-selected objects
            const updateList = (ids) => {
                const updateSelectedObjects = (objects) => {
                    // Look up from the
                    const getObject = (id) => {
                        return objects[id];
                    };
                    this.selectedObjects =
                        ids.filter(getObject).map(getObject);
                };

                // Look up objects by id, then populate right-hand list
                objectService.getObjects(ids).then(updateSelectedObjects);
            };

            // Reject attempts to select objects of the wrong type
            $scope.$watch(getTreeSelection, validateTreeSelection);

            // Make sure right-hand list matches underlying model
            $scope.$watchCollection( () => {
                return this.getField();
            }, updateList);

            // Look up root object, then store it
            objectService.getObjects([ROOT_ID]).then(storeRoot);

            this.$scope = $scope;
            this.selectedObjects = [];

            // Expose tree/list model for use in template directly
            this.treeModel = treeModel;
            this.listModel = listModel;
        }




        // Set the value of the field being edited
        setField(value) {
            this.$scope.ngModel[this.$scope.field] = value;
        }

        // Get the value of the field being edited
        getField() {
            return this.$scope.ngModel[this.$scope.field] || [];
        }


        /**
         * Get the root object to show in the left-hand tree.
         * @returns {DomainObject} the root object
         */
        root() {
            return this.rootObject;
        }

        /**
         * Add a domain object to the list of selected objects.
         * @param {DomainObject} the domain object to select
         */
        select(domainObject) {
            let id = domainObject && domainObject.getId(),
                list = this.getField() || [];
            // Only select if we have a valid id,
            // and it isn't already selected
            if (id && list.indexOf(id) === -1) {
                this.setField(list.concat([id]));
            }
        }

        /**
         * Remove a domain object from the list of selected objects.
         * @param {DomainObject} the domain object to select
         */
        deselect(domainObject) {
            let id = domainObject && domainObject.getId(),
                list = this.getField() || [];
            // Only change if this was a valid id,
            // for an object which was already selected
            if (id && list.indexOf(id) !== -1) {
                // Filter it out of the current field
                this.setField(list.filter( (otherId) => {
                    return otherId !== id;
                }));
                // Clear the current list selection
                delete this.listModel.selectedObject;
            }
        }

        /**
         * Get the currently-selected domain objects.
         * @returns {DomainObject[]} the current selection
         */
        selected() {
            return this.selectedObjects;
        }
      }
        return SelectorController;
    }
);
