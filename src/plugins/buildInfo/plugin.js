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

define([
], function (
) {
    return function (buildInfo) {
        return function (openmct) {
            const aliases = { timestamp: "Built" };
            const descriptions = {
                timestamp: "The date on which this version of Open MCT was built.",
                revision: "A unique revision identifier for the client sources.",
                branch: "The name of the branch that was used during the build."
            };

            Object.keys(buildInfo).forEach(function (key) {
                openmct.legacyExtension("versions", {
                    key: key,
                    name: aliases[key] || (key.charAt(0).toUpperCase() + key.substring(1)),
                    value: buildInfo[key],
                    description: descriptions[key]
                });
            });
        };
    };
});
