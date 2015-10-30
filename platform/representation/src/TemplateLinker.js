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
         * The `templateLinker` service is intended for internal use by
         * the `mct-include` and `mct-representation` directives. It is
         * used to support common behavior of directives; specifically,
         * loading templates and inserting them into a specified element,
         * and/or removing that element from the DOM when there is no
         * template to populate it with.
         *
         * @param $http Angular's `$http` service
         * @param {Function} $compile Angular's `$compile` service
         * @param $log Angular's `$log` service
         * @private
         */
        function TemplateLinker($templateRequest, $sce, $compile, $log) {
            this.$templateRequest = $templateRequest;
            this.$sce = $sce;
            this.$compile = $compile;
            this.$log = $log;
        }

        TemplateLinker.prototype.load = function (templateUrl) {
            return this.$templateRequest(
                this.$sce.trustAsResourceUrl(templateUrl),
                false
            );
        };

        /**
         * Get a path to a template from an extension definition fo
         * a template, representation, or view.
         * @param {TemplateDefinition} extensionDefinition the definition
         *        of the template/representation/view to resolve
         */
        TemplateLinker.prototype.getPath = function (extensionDefinition) {
            return [
                extensionDefinition.bundle.path,
                extensionDefinition.bundle.resources,
                extensionDefinition.templateUrl
            ].join('/');
        };

        /**
         * Populate the given element with templates, within the given scope;
         * intended to support the `link` function of the supported directives.
         *
         * @param {Scope} scope the Angular scope to use when rendering
         *        templates
         * @param element the jqLite-wrapped element into which templates
         *        should be inserted
         * @returns {Function} a function which can be called with a template
         *          URL to switch templates, or `undefined` to remove.
         */
        TemplateLinker.prototype.link = function (scope, element, templateUrl) {
            var activeElement = element,
                activeTemplateUrl,
                comment = this.$compile('<!-- hidden mct element -->')(scope),
                self = this;

            function removeElement() {
                if (activeElement !== comment) {
                    activeElement.replaceWith(comment);
                    activeElement = comment;
                }
            }

            function addElement() {
                if (activeElement !== element) {
                    activeElement.replaceWith(element);
                    activeElement = element;
                    activeElement.empty();
                }
            }

            function populateElement(template) {
                element.empty();
                element.append(self.$compile(template)(scope));
            }

            function badTemplate(templateUrl) {
                self.$log.warn("Couldn't load template at " + templateUrl);
                removeElement();
            }

            function changeTemplate(templateUrl) {
                if (templateUrl !== activeTemplateUrl) {
                    if (templateUrl) {
                        addElement();
                        self.load(templateUrl).then(function (template) {
                            // Avoid race conditions
                            if (templateUrl === activeTemplateUrl) {
                                populateElement(template);
                            }
                        }, function () {
                            badTemplate(templateUrl);
                        });
                    } else {
                        removeElement();
                    }
                    activeTemplateUrl = templateUrl;
                }
            }

            if (templateUrl) {
                changeTemplate(templateUrl);
            } else {
                removeElement();
            }

            return changeTemplate;
        };

        return TemplateLinker;
    }
);

