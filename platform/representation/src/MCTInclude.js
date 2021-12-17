/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * Module defining MCTInclude. Created by vwoeltje on 11/7/14.
 */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * Module defining MCTInclude. Created by vwoeltje on 11/7/14.
 */
function MCTInclude(templates, templateLinker) {
    var templateMap = {};

    function link(scope, element) {
        var changeTemplate = templateLinker.link(
            scope,
            element,
            scope.key && templateMap[scope.key]
        );

        scope.$watch('key', function (newKey, oldKey) {
            if (newKey !== oldKey) {
                changeTemplate(newKey && templateMap[newKey]);
            }
        });
    }

    // Prepopulate templateMap for easy look up by key
    templates.forEach(function (template) {
        var key = template.key;
        // First found should win (priority ordering)
        templateMap[key] =
            templateMap[key] || template;
    });

    return {
        // Only show at the element level
        restrict: "E",

        // Use the included controller to populate scope
        link: link,

        // May hide the element, so let other directives act first
        priority: -1000,

        // Two-way bind key, ngModel, and parameters
        scope: {
            key: "=",
            ngModel: "=",
            parameters: "="
        }
    };
}

export default MCTInclude;