/*global define,Promise*/

/**
 * Module defining MCTInclude. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Defines the mct-include directive. This acts like the
         * ng-include directive, except it accepts a symbolic
         * key which can be exposed by bundles.
         * @constructor
         */
        function MCTInclude(templates) {
            var templateMap = {};

            templates.forEach(function (template) {
                var path = [
                    template.bundle.path,
                    template.bundle.resources,
                    template.templateUrl
                ].join("/");
                templateMap[template.key] = path;
            });

            function controller($scope) {
                $scope.inclusion = templateMap[$scope.key];
            }

            return {
                restrict: "E",
                controller: controller,
                template: '<ng-include src="inclusion"></ng-include>',
                scope: { key: "=", ngModel: "=", parameters: "=" }
            };
        }

        return MCTInclude;
    }
);