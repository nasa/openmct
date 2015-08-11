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
    ['./CapabilityTable'],
    function (CapabilityTable) {
        "use strict";

        // Symbolic value for the type table for cases when any type
        // is allowed to be contained.
        var ANY = true;

        /**
         * Supports composition policy by maintaining a table of
         * domain object types, to determine if they can contain
         * other domain object types. This is determined at application
         * start time (plug-in support means this cannot be determined
         * prior to that, but we don't want to redo these calculations
         * every time policy is checked.)
         * @constructor
         * @memberof platform/containment
         */
        function ContainmentTable(typeService, capabilityService) {
            var self = this,
                types = typeService.listTypes(),
                capabilityTable = new CapabilityTable(typeService, capabilityService);

            // Add types which have all these capabilities to the set
            // of allowed types
            function addToSetByCapability(set, has) {
                has = Array.isArray(has) ? has : [has];
                types.forEach(function (type) {
                    var typeKey = type.getKey();
                    set[typeKey] = has.map(function (capabilityKey) {
                        return capabilityTable.hasCapability(typeKey, capabilityKey);
                    }).reduce(function (a, b) {
                        return a && b;
                    }, true);
                });
            }

            // Add this type (or type description) to the set of allowed types
            function addToSet(set, type) {
                // Is this a simple case of an explicit type identifier?
                if (typeof type === 'string') {
                    // If so, add it to the set of allowed types
                    set[type] = true;
                } else {
                    // Otherwise, populate that set based on capabilities
                    addToSetByCapability(set, (type || {}).has || []);
                }
            }

            // Add to the lookup table for this type
            function addToTable(type) {
                var key = type.getKey(),
                    definition = type.getDefinition() || {},
                    contains = definition.contains;

                // Check for defined containment restrictions
                if (contains === undefined) {
                    // If not, accept anything
                    self.table[key] = ANY;
                } else {
                    // Start with an empty set...
                    self.table[key] = {};
                    // ...cast accepted types to array if necessary...
                    contains = Array.isArray(contains) ? contains : [contains];
                    // ...and add all containment rules to that set
                    contains.forEach(function (c) {
                        addToSet(self.table[key], c);
                    });
                }
            }

            // Build the table
            this.table = {};
            types.forEach(addToTable);
        }

        /**
         * Check if domain objects of one type can contain domain
         * objects of another type.
         * @param {Type} containerType type of the containing domain object
         * @param {Type} containedType type of the domain object
         *        to be contained
         * @returns {boolean} true if allowable
         */
        ContainmentTable.prototype.canContain = function (containerType, containedType) {
            var set = this.table[containerType.getKey()] || {};
            // Recognize either the symbolic value for "can contain
            // anything", or lookup the specific type from the set.
            return (set === ANY) || set[containedType.getKey()];
        };

        return ContainmentTable;
    }
);
