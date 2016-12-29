/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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


define(
    [],
    () => {

        /**
         * Build a table indicating which types are expected to expose
         * which capabilities. This supports composition policy (rules
         * for which objects can contain which other objects) which
         * sometimes is determined based on the presence of capabilities.
         * @constructor
         * @memberof platform/containment
         */
        class CapabilityTable {
          constructor(typeService, capabilityService) {

            // Build an initial model for a type
            const buildModel = (type) => {
                let model = Object.create(type.getInitialModel() || {});
                model.type = type.getKey();
                return model;
            }

            // Get capabilities expected for this type
            const getCapabilities = (type) => {
                return capabilityService.getCapabilities(buildModel(type));
            }

            // Populate the lookup table for this type's capabilities
            const addToTable = (type) => {
                let typeKey = type.getKey();
                Object.keys(getCapabilities(type)).forEach( (key) => {
                    this.table[key] = this.table[key] || {};
                    this.table[key][typeKey] = true;
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
        hasCapability(typeKey, capabilityKey) {
            return (this.table[capabilityKey] || {})[typeKey];
        };
      }
        return CapabilityTable;
    }
);
