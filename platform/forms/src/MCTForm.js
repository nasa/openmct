/*global define,Promise*/

/**
 * Module defining MCTForm. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function MCTForm() {
            var templatePath = [
                "platform/forms", //MCTForm.bundle.path,
                "res", //MCTForm.bundle.resources,
                "templates/form.html"
            ].join("/");

            function controller($scope) {
                $scope.$watch("mctForm", function (mctForm) {
                    if ($scope.name) {
                        $scope.$parent.mctForm = mctForm;
                    }
                });
            }

            return {
                restrict: "E",
                templateUrl: templatePath,
                link: controller,
                scope: {
                    structure: "=",
                    ngModel: "=",
                    name: "@"
                }
            };
        }

        return MCTForm;
    }
);