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

define([], function () {

    /**
     * A TypeRegistry maintains the definitions for different types
     * that domain objects may have.
     * @interface TypeRegistry
     * @memberof module:openmct
     */
    function TypeRegistry() {
        this.types = {};
    }

    /**
     * Register a new type of view.
     *
     * @param {string} typeKey a string identifier for this type
     * @param {module:openmct.Type} type the type to add
     * @method addType
     * @memberof module:openmct.TypeRegistry#
     */
    TypeRegistry.prototype.addType = function (typeKey, type) {
        this.types[typeKey] = type;
    };

    /**
     * List keys for all registered types.
     * @method list
     * @memberof module:openmct.TypeRegistry#
     * @returns {string[]} all registered type keys
     */
    TypeRegistry.prototype.listKeys = function () {
        return Object.keys(this.types);
    };

    /**
     * Retrieve a registered type by its key.
     * @method get
     * @param {string} typeKey the key for htis type
     * @memberof module:openmct.TypeRegistry#
     * @returns {module:openmct.Type} the registered type
     */
    TypeRegistry.prototype.get = function (typeKey) {
        return this.types[typeKey];
    };

    return TypeRegistry;
});


