/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import Type from './Type.js';

const UNKNOWN_TYPE = new Type({
  key: 'unknown',
  name: 'Unknown Type',
  cssClass: 'icon-object-unknown'
});

/**
 * @typedef TypeDefinition
 * @property {string} label the name for this type of object
 * @property {string} description a longer-form description of this type
 * @property {function(domainObject:DomainObject): void} [initialize] a function which initializes
 *           the model for new domain objects of this type
 * @property {boolean} [creatable=false] true if users should be allowed to
 *           create this type (default: false)
 * @property {string} [cssClass] the CSS class to apply for icons
 */

/**
 * A TypeRegistry maintains the definitions for different types
 * that domain objects may have.
 * @interface TypeRegistry
 */
export default class TypeRegistry {
  constructor() {
    /**
     * @type {Record<string, Type>}
     */
    this.types = {};

    /**
     * @type {Record<string, Type>}
     */
    this.deactivatedTypes = {};
  }
  /**
   * Register a new object type.
   *
   * @param {string} typeKey a string identifier for this type
   * @param {TypeDefinition} typeDef the type to add
   * @param {boolean} isDeactivated if true, will load type in a deactivated state
   */
  addType(typeKey, typeDef, isDeactivated = false) {
    this.standardizeType(typeDef);

    if (isDeactivated) {
      this.deactivatedTypes[typeKey] = new Type(typeDef);
    } else {
      this.types[typeKey] = new Type(typeDef);
    }
  }
  /**
   * Takes a typeDef, standardizes it, and logs warnings about unsupported
   * usage.
   * @private
   */
  standardizeType(typeDef) {
    if (Object.prototype.hasOwnProperty.call(typeDef, 'label')) {
      if (!typeDef.name) {
        typeDef.name = typeDef.label;
      }

      delete typeDef.label;
    }
  }
  removeType(typeKey) {
    delete this.types[typeKey];
  }
  removeDeactivatedType(typeKey) {
    delete this.deactivatedTypes[typeKey];
  }
  /**
   * List keys for all registered types.
   * @returns {string[]} all registered type keys
   */
  listKeys() {
    return Object.keys(this.types);
  }
  /**
   * List keys for all deactivated types.
   * @returns {string[]} all deactivated type keys
   */
  listDeactivatedKeys() {
    return Object.keys(this.deactivatedTypes);
  }
  /**
   * Retrieve a registered type by its key.
   * @param {string} typeKey the key for this type
   * @returns {Type} the registered type
   */
  get(typeKey) {
    return this.types[typeKey] || UNKNOWN_TYPE;
  }
  /**
   * Retrieve a registered type that's deactivated by its key.
   * @param {string} typeKey the key for this deactivated type
   * @returns {Type} the registered type that's deactivated
   */
  getDeactivated(typeKey) {
    return this.deactivatedTypes[typeKey] || UNKNOWN_TYPE;
  }
  importLegacyTypes(types) {
    types
      .filter((t) => this.get(t.key) === UNKNOWN_TYPE)
      .forEach((type) => {
        let def = Type.definitionFromLegacyDefinition(type);
        this.addType(type.key, def);
      });
  }
}
