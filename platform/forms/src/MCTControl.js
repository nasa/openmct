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
                    $scope.inclusion = controlMap[$scope.key];
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

                // Pass through Angular's normal input field attributes
                scope: {
                    ngModel: "=",
                    ngOptions: "=",
                    ngDisabled: "=",
                    ngPattern: "="
                }
            };
        }
    }
);