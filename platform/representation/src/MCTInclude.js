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
         * key which can be exposed by bundles, instead of requiring
         * an explicit path.
         *
         * This directive uses two-way binding for three attributes:
         *
         * * `key`, matched against the key of a defined template extension
         *   in order to determine which actual template to include.
         * * `ng-model`, populated as `ngModel` in the loaded template's
         *   scope; used for normal ng-model purposes (e.g. if the
         *   included template is meant to two-way bind to a data model.)
         * * `parameters`, used to communicate display parameters to
         *   the included template (e.g. title.) The difference between
         *   `parameters` and `ngModel` is intent: Both are two-way
         *   bound, but `ngModel` is useful for data models (more like
         *   an output) and `parameters` is meant to be useful for
         *   display parameterization (more like an input.)
         *
         * @constructor
         * @param {TemplateDefinition[]} templates an array of
         *        template extensions
         */
        function MCTInclude(templates) {
            var templateMap = {};

            // Prepopulate templateMap for easy look up by key
            templates.forEach(function (template) {
                var key = template.key,
                    path = [
                        template.bundle.path,
                        template.bundle.resources,
                        template.templateUrl
                    ].join("/");
                // First found should win (priority ordering)
                templateMap[key] = templateMap[key] || path;
            });

            function controller($scope) {
                // Pass the template URL to ng-include via scope.
                $scope.inclusion = templateMap[$scope.key];
            }

            return {
                // Only show at the element level
                restrict: "E",

                // Use the included controller to populate scope
                controller: controller,

                // Use ng-include as a template; "inclusion" will be the real
                // template path
                template: '<ng-include src="inclusion"></ng-include>',

                // Two-way bind key, ngModel, and parameters
                scope: { key: "=", ngModel: "=", parameters: "=" }
            };
        }

        return MCTInclude;
    }
);