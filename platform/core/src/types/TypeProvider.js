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
    ['./TypeImpl', './MergeModels'],
    (TypeImpl, mergeModels) => {

        /**
         * Provides domain object types that are available/recognized within
         * the system.
         *
         * @interface TypeService
         */
        /**
         * Get a specific type by name.
         *
         * @method TypeService#getType
         * @param {string} key the key (machine-readable identifier)
         *        for the type of interest
         * @returns {Type} the type identified by this key
         */
        /**
         * List all known types.
         *
         * @method TypeService#listTypes
         * @returns {Type[]} all known types
         */

        const TO_CONCAT = ['inherits', 'capabilities', 'properties', 'features'],
            TO_MERGE = ['model'];

        const copyKeys = (a, b) => {
            Object.keys(b).forEach( (k) => {
                a[k] = b[k];
            });
        }

        const removeDuplicates = (array) => {
            let set = {};
            return array ? array.filter( (element) => {
                // Don't filter objects (e.g. property definitions)
                if (element instanceof Object && !(element instanceof String)) {
                    return true;
                }

                return set[element] ?
                        false :
                        (set[element] = true);
            }) : array;
        }

        // Reduce an array of type definitions to a single type definition,
        // which has merged all properties in order.
        const collapse = (typeDefs) => {
            let collapsed = typeDefs.reduce( (a, b) => {
                let result = {};
                copyKeys(result, a);
                copyKeys(result, b);

                // Special case: Do a merge, e.g. on "model"
                TO_MERGE.forEach( (k) => {
                    if (a[k] && b[k]) {
                        result[k] = mergeModels(a[k], b[k]);
                    }
                });

                // Special case: Concatenate certain arrays
                TO_CONCAT.forEach( (k) => {
                    if (a[k] || b[k]) {
                        result[k] = (a[k] || []).concat(b[k] || []);
                    }
                });
                return result;
            }, {});

            // Remove any duplicates from the collapsed array
            TO_CONCAT.forEach( (k) => {
                if (collapsed[k]) {
                    collapsed[k] = removeDuplicates(collapsed[k]);
                }
            });
            return collapsed;
        }

        /**
         * A type provider provides information about types of domain objects
         * within the running Open MCT instance.
         *
         * @param {Array<TypeDefinition>} types the raw type
         *        definitions for this type.
         * @memberof platform/core
         * @constructor
         */
        class TypeProvider {
          constructor(types) {
            let rawTypeDefinitions = types,
                typeDefinitions = (function (typeDefArray) {
                    let result = {};
                    typeDefArray.forEach( (typeDef) => {
                        let k = typeDef.key;
                        if (k) {
                            result[k] = (result[k] || []).concat(typeDef);
                        }
                    });
                    return result;
                }(rawTypeDefinitions));


            this.typeMap = {};
            this.typeDefinitions = typeDefinitions;
            this.rawTypeDefinitions = types;
        }

        listTypes() {
            return removeDuplicates(
                this.rawTypeDefinitions.filter( (def) => {
                    return def.key;
                }).map( (def) => {
                    return def.key;
                }).map( (key) => {
                    return this.getType(key);
                })
            );
        };

        getType(key) {
            var typeDefinitions = this.typeDefinitions

            const getUndefinedType = () => {
                return (this.undefinedType = this.undefinedType || collapse(
                    this.rawTypeDefinitions.filter( (typeDef) => {
                        return !typeDef.key;
                    })
                ));
            }

            const asArray = (value) => {
                return Array.isArray(value) ? value : [value];
            }

            const lookupTypeDef = (typeKey) => {
                const buildTypeDef = (typeKeyToBuild) => {
                    let typeDefs = typeDefinitions[typeKeyToBuild] || [],
                        inherits = typeDefs.map( (typeDef) => {
                            return asArray(typeDef.inherits || []);
                        }).reduce( (a, b) => {
                            return a.concat(b);
                        }, []),
                        def = collapse(
                            [getUndefinedType()].concat(
                                inherits.map(lookupTypeDef)
                            ).concat(typeDefs)
                        );

                    // Always provide a default name
                    def.model = def.model || {};
                    def.model.name = def.model.name ||
                        ("Unnamed " + (def.name || "Object"));

                    return def;
                }

                return (this.typeMap[typeKey] =
                    this.typeMap[typeKey] || buildTypeDef(typeKey));
            }

            return new TypeImpl(lookupTypeDef(key));
        };
      }
        return TypeProvider;
    }

);
