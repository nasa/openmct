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

/**
 * Type implementation. Defines a type object which wraps a
 * type definition and exposes useful methods for inspecting
 * that type and understanding its relationship to other
 * types.
 *
 * @module core/type/type-impl
 */
define(
    ['./TypeProperty'],
    function (TypeProperty) {
        "use strict";

        /**
         * Construct a new type. Types describe categories of
         * domain objects.
         *
         * @param {TypeDefinition} typeDef an object containing
         *        key-value pairs describing a type and its
         *        relationship to other types.
         * @memberof module:core/type/type-impl
         */
        function TypeImpl(typeDef) {
            var inheritList = typeDef.inherits || [],
                featureSet = {};

            (typeDef.features || []).forEach(function (feature) {
                featureSet[feature] = true;
            });

            return {
                /**
                 * Get the string key which identifies this type.
                 * This is the type's machine-readable name/identifier,
                 * and will correspond to the "type" field of the models
                 * of domain objects of this type.
                 *
                 * @returns {string} the key which identifies this type
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                getKey: function () {
                    return typeDef.key;
                },
                /**
                 * Get the human-readable name for this type, as should
                 * be displayed in the user interface when referencing
                 * this type.
                 *
                 * @returns {string} the human-readable name of this type
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                getName: function () {
                    return typeDef.name;
                },
                /**
                 * Get the human-readable description for this type, as should
                 * be displayed in the user interface when describing
                 * this type.
                 *
                 * @returns {string} the human-readable description of this type
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                getDescription: function () {
                    return typeDef.description;
                },
                /**
                 * Get the glyph associated with this type. Glyphs are
                 * single-character strings which will appear as icons (when
                 * displayed in an appropriate font) which visually
                 * distinguish types from one another.
                 *
                 * @returns {string} the glyph to be displayed
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                getGlyph: function () {
                    return typeDef.glyph;
                },
                /**
                 * Get an array of properties associated with objects of
                 * this type, as might be shown in a Create wizard or
                 * an Edit Properties view.
                 *
                 * @return {Array<TypeProperty>} properties associated with
                 *         objects of this type
                 */
                getProperties: function () {
                    return (typeDef.properties || []).map(TypeProperty);
                },
                /**
                 * Get the initial state of a model for domain objects of
                 * this type.
                 *
                 * @return {object} initial domain object model
                 */
                getInitialModel: function () {
                    return typeDef.model || {};
                },
                /**
                 * Get the raw type definition for this type. This is an
                 * object containing key-value pairs of type metadata;
                 * this allows the retrieval and use of custom type
                 * properties which are not recognized within this interface.
                 *
                 * @returns {object} the raw definition for this type
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                getDefinition: function () {
                    return typeDef;
                },
                /**
                 * Check if this type is or inherits from some other type.
                 *
                 * TODO: Rename, "instanceOf" is a misnomer (since there is
                 *       no "instance", so to speak.)
                 *
                 * @param {string|module:core/type/type-implTypeImpl} key either
                 *        a string key for a type, or an instance of a type
                 *        object, which this
                 * @returns {boolean} true
                 * @memberof module:core/type/type-impl.TypeImpl#
                 */
                instanceOf: function instanceOf(key) {

                    if (key === typeDef.key) {
                        return true;
                    } else if (inheritList.indexOf(key) > -1) {
                        return true;
                    } else if (!key) {
                        return true;
                    } else if (key !== null && typeof key === 'object') {
                        return key.getKey ? instanceOf(key.getKey()) : false;
                    } else {
                        return false;
                    }
                },
                /**
                 * Check if a type should support a given feature. This simply
                 * checks for the presence or absence of the feature key in
                 * the type definition's "feature" field.
                 * @param {string} feature a string identifying the feature
                 * @returns {boolean} true if the feature is supported
                 */
                hasFeature: function (feature) {
                    return featureSet[feature] || false;
                }
            };
        }

        return TypeImpl;
    }
);