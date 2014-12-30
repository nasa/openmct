/*global define*/

define(
    [],
    function () {
        "use strict";

        function GetterSetterController($scope) {

            function updateGetterSetter() {
                if (typeof $scope.ngModel === 'function') {
                    $scope.getterSetter.value = $scope.ngModel();
                }
            }

            function updateNgModel() {
                if (typeof $scope.ngModel === 'function') {
                    $scope.ngModel($scope.getterSetter.value);
                }
            }

            $scope.$watch("ngModel()", updateGetterSetter);
            $scope.$watch("getterSetter.value", updateNgModel);
            $scope.getterSetter = {};
        }

        return GetterSetterController;

    }
);