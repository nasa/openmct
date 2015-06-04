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
 * Module defining ExampleDirective. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        var HAS_EXTENSIONS = "A directive loaded these message from " +
                    "example extensions.",
            NO_EXTENSIONS = "A directive tried to load example extensions," +
                    " but found none.",
            MESSAGE = "I heard this from my partial constructor.";

        /**
         *
         * @constructor
         */
        function ExampleDirective(examples) {
            // Build up a template from example extensions
            var template = examples.length > 0 ?
                    HAS_EXTENSIONS : NO_EXTENSIONS;

            template += "<ul>";
            examples.forEach(function (E) {
                template += "<li>";
                if (typeof E === 'function') {
                    template += (new E(MESSAGE)).getText();
                } else {
                    template += E.text;
                }
                template += "</li>";
            });
            template += "</ul>";

            return {
                template: template
            };
        }

        return ExampleDirective;
    }
);