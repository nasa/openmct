/*global define*/
define(
    [],
    function () {
        'use strict';

        /**
         * Controller for the `dialog-button` control type. Provides
         * structure for a button (embedded via the template) which
         * will show a dialog for editing a single property when clicked.
         * @constructor
         * @param $scope the control's Angular scope
         * @param {DialogService} dialogService service to use to prompt
         *        for user input
         */
        function DialogButtonController($scope, dialogService) {
            var buttonStructure,
                buttonForm,
                field;

            // Store the result of user input to the model
            function storeResult(result) {
                $scope.ngModel[$scope.field] = result[$scope.field];
            }

            // Prompt for user input
            function showDialog() {
                // Prepare initial state
                var state = {};
                state[$scope.field] = $scope.ngModel[$scope.field];

                // Show dialog, then store user input (if any)
                dialogService.getUserInput(buttonForm, state).then(storeResult);
            }

            // Refresh state based on structure for this control
            function refreshStructure(structure) {
                var row = Object.create(structure.dialog || {});

                structure = structure || {};

                // Add the key, to read back from that row
                row.key = $scope.field;

                // Prepare the structure for the button itself
                buttonStructure = {};
                buttonStructure.glyph = structure.glyph;
                buttonStructure.name = structure.name;
                buttonStructure.description = structure.description;
                buttonStructure.click = showDialog;

                // Prepare the form; a single row
                buttonForm = {
                    name: structure.title,
                    sections: [ { rows: [ row ] } ]
                };
            }

            $scope.$watch('structure', refreshStructure);

            return {
                /**
                 * Get the structure for an `mct-control` of type
                 * `button`; a dialog will be launched when this button
                 * is clicked.
                 * @returns dialog structure
                 */
                getButtonStructure: function () {
                    return buttonStructure;
                }
            };
        }

        return DialogButtonController;
    }
);