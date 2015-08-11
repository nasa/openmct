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
/*global define*/


define(
    [],
    function () {
        "use strict";

        /**
         * Build a table indicating which types are expected to expose
         * which capabilities. This supports composition policy (rules
         * for which objects can contain which other objects) which
         * sometimes is determined based on the presence of capabilities.
         * @constructor
         * @memberof platform/containment
         */
        function CapabilityTable(typeService, capabilityService) {
            var self = this;

            // Build an initial model for a type
            function buildModel(type) {
                var model = Object.create(type.getInitialModel() || {});
                model.type = type.getKey();
                return model;
            }

            // Get capabilities expected for this type
            function getCapabilities(type) {
                return capabilityService.getCapabilities(buildModel(type));
            }

            // Populate the lookup table for this type's capabilities
            function addToTable(type) {
                var typeKey = type.getKey();
                Object.keys(getCapabilities(type)).forEach(function (key) {
                    self.table[key] = self.table[key] || {};
                    self.table[key][typeKey] = true;
                });
            }

            // Build the table
            this.table = {};
            (typeService.listTypes() || []).forEach(addToTable);
        }

        /**
         * Check if a type is expected to expose a specific capability.
         * @param {string} typeKey the type identifier
         * @param {string} capabilityKey the capability identifier
         * @returns {boolean} true if expected to be exposed
         */
        CapabilityTable.prototype.hasCapability = function (typeKey, capabilityKey) {
            return (this.table[capabilityKey] || {})[typeKey];
        };

        return CapabilityTable;
    }
);
