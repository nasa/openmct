/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the domain object selector control.
         * @constructor
         * @param {ObjectService} objectService service from which to
         *        read domain objects
         * @param $scope Angular scope for this controller
         */
        function SelectorController(objectService, $scope) {
            var treeModel = {},
                previousSelected;

            // For watch; look at the user's selection in the tree
            function getTreeSelection() {
                return treeModel.selectedObject;
            }

            // Get the value of the field being edited
            function getField() {
                return $scope.ngModel[$scope.field];
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

            // Reject attempts to select objects of the wrong type
            $scope.$watch(getTreeSelection, validateTreeSelection);

            return {
                // Expose tree model for use in template directly
                treeModel: treeModel
            };
        }


        return SelectorController;
    }
);