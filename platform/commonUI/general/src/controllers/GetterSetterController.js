/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * This controller acts as an adapter to permit getter-setter
         * functions to be used as ng-model arguments to controls,
         * such as the input-filter. This is supported natively in
         * Angular 1.3+ via `ng-model-options`, so this controller
         * should be made obsolete after any upgrade to Angular 1.3.
         *
         * It expects to find in scope a value `ngModel` which is a
         * function which, when called with no arguments, acts as a
         * getter, and when called with one argument, acts as a setter.
         *
         * It also publishes into the scope a value `getterSetter.value`
         * which is meant to be used as an assignable expression.
         *
         * This controller watches both of these; when one changes,
         * it will update the other's value to match. Because of this,
         * the `ngModel` function should be both stable and computationally
         * inexpensive, as it will be invoked often.
         *
         * Getter-setter style models can be preferable when there
         * is significant indirection between templates; "dotless"
         * expressions in `ng-model` can behave unexpectedly due to the
         * rules of scope, but dots are lost when passed in via `ng-model`
         * (so if a control is internally implemented using regular
         * form elements, it can't transparently pass through the `ng-model`
         * parameter it received.) Getter-setter functions are never the
         * target of a scope assignment and so avoid this problem.
         *
         * @constructor
         * @param {Scope} $scope the controller's scope
         */
        function GetterSetterController($scope) {

            // Update internal assignable state based on changes
            // to the getter-setter function.
            function updateGetterSetter() {
                if (typeof $scope.ngModel === 'function') {
                    $scope.getterSetter.value = $scope.ngModel();
                }
            }

            // Update the external getter-setter based on changes
            // to the assignable state.
            function updateNgModel() {
                if (typeof $scope.ngModel === 'function') {
                    $scope.ngModel($scope.getterSetter.value);
                }
            }

            // Watch for changes to both expressions
            $scope.$watch("ngModel()", updateGetterSetter);
            $scope.$watch("getterSetter.value", updateNgModel);

            // Publish an assignable field into scope.
            $scope.getterSetter = {};

        }

        return GetterSetterController;

    }
);