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
    ["./OneWayBinder"],
    function (OneWayBinder) {
        "use strict";

        /**
         * Defines the mct-include directive. This acts like the
         * ng-include directive, except it accepts a symbolic
         * key which can be exposed by bundles, instead of requiring
         * an explicit path.
         *
         * This directive uses the following attributes:
         *
         * * `key`: An Angular expression, matched against the key of a
         *   defined template extension in order to determine which actual
         *   template to include.
         * * `mct-model`: An Angular expression; its value is watched
         *   and passed into the template's scope as property `mctModel`.
         * * `parameters`: An Angular expression; its value is watched
         *   and passed into the template's scope as property `parameters`.
         *
         * The difference between `parameters` and `mct-model` is intent;
         * `parameters` should be used for display-time parameters which
         * are not meant to be changed, whereas `mct-model` should be
         * used to pass in objects whose properties will (or may) be
         * modified by the included template.
         *
         * @memberof platform/representation
         * @constructor
         * @param {TemplateDefinition[]} templates an array of
         *        template extensions
         */
        function MCTInclude(templates, templateLinker) {
            var templateMap = {};

            function link(scope, element, attrs) {
                var parent = scope.$parent,
                    key = parent.$eval(attrs.key),
                    changeTemplate = templateLinker.link(
                        scope,
                        element,
                        key && templateMap[key]
                    ),
                    binder = new OneWayBinder(scope, attrs);

                binder.bind('ngModel');
                binder.bind('parameters');

                binder.alias('ngModel', 'mctModel');
                binder.alias('mctModel', 'ngModel');

                binder.watch('key', function (key) {
                    changeTemplate(key && templateMap[key]);
                });
            }

            // Prepopulate templateMap for easy look up by key
            templates.forEach(function (template) {
                var key = template.key;
                // First found should win (priority ordering)
                templateMap[key] =
                    templateMap[key] || templateLinker.getPath(template);
            });

            return {
                // Only show at the element level
                restrict: "E",

                // Use the included controller to populate scope
                link: link,

                // May hide the element, so let other directives act first
                priority: -1000,

                // Isolate this scope; do not inherit properties from parent
                scope: {}
            };
        }

        return MCTInclude;
    }
);

