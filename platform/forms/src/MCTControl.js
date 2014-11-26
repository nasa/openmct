/*global define*/

define(
    [],
    function () {
        "use strict";

        function MCTControl(controls) {
            var controlMap = {};

            // Prepopulate controlMap for easy look up by key
            controls.forEach(function (control) {
                var path = [
                    control.bundle.path,
                    control.bundle.resources,
                    control.templateUrl
                ].join("/");
                controlMap[control.key] = path;
            });

            function controller($scope) {
                $scope.$watch("key", function (key) {
                    // Pass the template URL to ng-include via scope.
                    $scope.inclusion = controlMap[key];
                });
            }

            return {
                // Only show at the element level
                restrict: "E",

                // Use the included controller to populate scope
                controller: controller,

                // Use ng-include as a template; "inclusion" will be the real
                // template path
                template: '<ng-include src="inclusion"></ng-include>',

                // ngOptions is terminal, so we need to be higher priority
                priority: 1000,

                // Pass through Angular's normal input field attributes
                scope: {
                    // Used to choose which form control to use
                    key: "=",

                    // The state of the form value itself
                    ngModel: "=",

                    // Enabled/disabled state
                    ngDisabled: "=",

                    // Whether or not input is required
                    ngRequired: "=",

                    // Pattern (for input fields)
                    ngPattern: "=",

                    // Set of choices (if any)
                    options: "=",

                    // Structure (subtree of Form Structure)
                    structure: "=",

                    // Name, as in "<input name="...
                    field: "="
                }
            };
        }

        return MCTControl;
    }
);