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
    ['./TypeImpl', './MergeModels'],
    function (TypeImpl, mergeModels) {
        'use strict';

        var TO_CONCAT = ['inherits', 'capabilities', 'properties', 'features'],
            TO_MERGE = ['model'];

        function copyKeys(a, b) {
            Object.keys(b).forEach(function (k) {
                a[k] = b[k];
            });
        }

        function removeDuplicates(array) {
            var set = {};
            return array ? array.filter(function (element) {
                // Don't filter objects (e.g. property definitions)
                if (element instanceof Object && !(element instanceof String)) {
                    return true;
                }

                return set[element] ?
                        false :
                        (set[element] = true);
            }) : array;
        }

        /**
         * A type provider provides information about types of domain objects
         * within the running Open MCT Web instance.
         *
         * @param {Array<TypeDefinition>} options.definitions the raw type
         *        definitions for this type.
         * @constructor
         * @memberof module:core/type/type-provider
         */
        function TypeProvider(types) {
            var rawTypeDefinitions = types,
                typeDefinitions = (function (typeDefArray) {
                    var result = {};
                    typeDefArray.forEach(function (typeDef) {
                        var k = typeDef.key;
                        if (k) {
                            result[k] = (result[k] || []).concat(typeDef);
                        }
                    });
                    return result;
                }(rawTypeDefinitions)),
                typeMap = {},
                undefinedType;

            // Reduce an array of type definitions to a single type definiton,
            // which has merged all properties in order.
            function collapse(typeDefs) {
                var collapsed = typeDefs.reduce(function (a, b) {
                    var result = {};
                    copyKeys(result, a);
                    copyKeys(result, b);

                    // Special case: Do a merge, e.g. on "model"
                    TO_MERGE.forEach(function (k) {
                        if (a[k] && b[k]) {
                            result[k] = mergeModels(a[k], b[k]);
                        }
                    });

                    // Special case: Concatenate certain arrays
                    TO_CONCAT.forEach(function (k) {
                        if (a[k] || b[k]) {
                            result[k] = (a[k] || []).concat(b[k] || []);
                        }
                    });
                    return result;
                }, {});

                // Remove any duplicates from the collapsed array
                TO_CONCAT.forEach(function (k) {
                    if (collapsed[k]) {
                        collapsed[k] = removeDuplicates(collapsed[k]);
                    }
                });
                return collapsed;
            }

            function getUndefinedType() {
                return (undefinedType = undefinedType || collapse(
                    rawTypeDefinitions.filter(function (typeDef) {
                        return !typeDef.key;
                    })
                ));
            }

            function asArray(value) {
                return Array.isArray(value) ? value : [value];
            }

            function lookupTypeDef(typeKey) {
                function buildTypeDef(typeKey) {
                    var typeDefs = typeDefinitions[typeKey] || [],
                        inherits = typeDefs.map(function (typeDef) {
                            return asArray(typeDef.inherits || []);
                        }).reduce(function (a, b) {
                            return a.concat(b);
                        }, []),
                        def = collapse(
                            [getUndefinedType()].concat(
                                inherits.map(lookupTypeDef)
                            ).concat(typeDefs)
                        );

                    // Always provide a default name
                    def.model = def.model || {};
                    def.model.name = def.model.name || (
                        "Unnamed " + (def.name || "Object")
                    );

                    return def;

                }

                return (typeMap[typeKey] = typeMap[typeKey] || buildTypeDef(typeKey));
            }


            return {
                /**
                 * Get a list of all types defined by this service.
                 *
                 * @returns {Promise<Array<module:core/type/type-impl.TypeImpl>>} a
                 *          promise for an array of all type instances defined
                 *          by this service.
                 * @memberof module:core/type/type-provider.TypeProvider#
                 */
                listTypes: function () {
                    var self = this;
                    return removeDuplicates(
                        rawTypeDefinitions.filter(function (def) {
                            return def.key;
                        }).map(function (def) {
                            return def.key;
                        }).map(function (key) {
                            return self.getType(key);
                        })
                    );
                },

                /**
                 * Get a specific type by name.
                 *
                 * @param {string} [key] the key (machine-readable identifier)
                 *        for the type of interest
                 * @returns {Promise<module:core/type/type-impl.TypeImpl>} a
                 *          promise for a type object identified by this key.
                 * @memberof module:core/type/type-provider.TypeProvider#
                 */
                getType: function (key) {
                    return new TypeImpl(lookupTypeDef(key));
                }
            };
        }

        // Services framework is designed to expect factories
        TypeProvider.instantiate = TypeProvider;

        return TypeProvider;


    }

);