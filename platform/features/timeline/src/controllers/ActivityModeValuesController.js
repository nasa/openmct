/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller which support the Values view of Activity Modes.
         * @constructor
         * @param {Array} resources definitions for extensions of
         *        category `resources`
         */
        function ActivityModeValuesController(resources) {
            var metadata = {};

            // Store metadata for a specific resource type
            function storeMetadata(resource) {
                var key = (resource || {}).key;
                if (key) {
                    metadata[key] = resource;
                }
            }

            // Populate the lookup table to resource metadata
            resources.forEach(storeMetadata);

            return {
                /**
                 * Look up metadata associated with the specified
                 * resource type.
                 */
                metadata: function (key) {
                    return metadata[key];
                }
            };
        }

        return ActivityModeValuesController;
    }
);
