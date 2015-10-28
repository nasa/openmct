/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
         * @memberof platform/representation
         * @constructor
         * @param {TemplateDefinition[]} templates an array of
         *        template extensions
         */
        function MCTInclude(templates, $sce) {
            var templateMap = {};

            // Prepopulate templateMap for easy look up by key
            templates.forEach(function (template) {
                var key = template.key,
                    path = $sce.trustAsResourceUrl([
                        template.bundle.path,
                        template.bundle.resources,
                        template.templateUrl
                    ].join("/"));
                // First found should win (priority ordering)
                templateMap[key] = templateMap[key] || path;
            });

            function link($scope, element, attrs, ctrl, transclude) {
                var originalElement = element,
                    activeElement = element;

                $scope.$watch('key', function (key) {
                    if (templateMap[key]) {
                        // Pass the template URL to ng-include via scope.
                        $scope.inclusion = templateMap[$scope.key];
                        // ...and add the template to the DOM.
                        transclude(function (clone) {
                            activeElement.replaceWith(clone);
                            activeElement = clone;
                        });
                    } else if (activeElement !== originalElement) {
                        // If the key is unknown, remove it from DOM entirely.
                        activeElement.replaceWith(originalElement);
                        activeElement = originalElement;
                    }
                });
            }

            return {
                transclude: 'element',

                priority: 601,

                terminal: true,

                // Only show at the element level
                restrict: "E",

                // Use the included controller to populate scope
                link: link,

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

