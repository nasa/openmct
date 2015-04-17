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
         */
        function ContainmentTable(typeService, capabilityService) {
            var types = typeService.listTypes(),
                capabilityTable = new CapabilityTable(typeService, capabilityService),
                table = {};

            // Check if one type can contain another
            function canContain(containerType, containedType) {
            }

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
                    table[key] = ANY;
                } else {
                    // Start with an empty set...
                    table[key] = {};
                    // ...cast accepted types to array if necessary...
                    contains = Array.isArray(contains) ? contains : [contains];
                    // ...and add all containment rules to that set
                    contains.forEach(function (c) {
                        addToSet(table[key], c);
                    });
                }
            }

            // Build the table
            types.forEach(addToTable);

            return {
                /**
                 * Check if domain objects of one type can contain domain
                 * objects of another type.
                 * @returns {boolean} true if allowable
                 */
                canContain: function (containerType, containedType) {
                    var set = table[containerType.getKey()] || {};
                    // Recognize either the symbolic value for "can contain
                    // anything", or lookup the specific type from the set.
                    return (set === ANY) || set[containedType.getKey()];
                }
            };

        }

        return ContainmentTable;
    }
);