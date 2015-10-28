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

define(
    [],
    function () {
        "use strict";

        /**
         * Pre-fetches templates and allows them to be
         *
         * @param {string[]} URLs to all templates which should be loadable
         * @param $http Angular's `$http` service
         * @param {Function} $compile Angular's `$compile` service
         * @param $log Angular's `$log` service
         */
        function TemplateLinker($http, $compile, $log) {
            this.templateMap = {};
            this.$http = $http;
            this.$compile = $compile;
            this.$log = $log;
        }

        TemplateLinker.prototype.load = function (templateUrl) {
            var $http = this.$http,
                $compile = this.$compile,
                $log = this.$log,
                templateMap = this.templateMap;

            return (templateMap[templateUrl] = templateMap[templateUrl] ||
                $http.get(templateUrl).then(function (response) {
                    return $compile(response.data);
                }, function () {
                    $log.warn("Couldn't load template at " + templateUrl);
                    templateMap[templateUrl] = undefined;
                }));
        };

        /**
         * @returns {Function} a function which can be called with a template
         *          URL to switch templates, or `undefined` to remove.
         */
        TemplateLinker.prototype.link = function (scope, element, transclude) {
            var originalElement = element,
                activeElement = element,
                self = this;

            function removeElement() {
                if (activeElement !== originalElement) {
                    activeElement.replaceWith(originalElement);
                    activeElement = originalElement;
                }
            }

            function replaceElement(clone, template) {
                activeElement.replaceWith(clone);
                activeElement = clone;
                activeElement.empty();
                template(scope, function (innerClone) {
                    clone.append(innerClone);
                });
            }

            function applyTemplate(template) {
                if (template) {
                    transclude(function (clone) {
                        replaceElement(clone, template);
                    });
                } else {
                    removeElement();
                }
            }

            return function (templateUrl) {
                if (templateUrl) {
                    self.load(templateUrl).then(applyTemplate);
                } else {
                    removeElement();
                }
            };
        };

        return TemplateLinker;
    }
);

