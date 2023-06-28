/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import Type from './Type';

const UNKNOWN_TYPE = new Type({
  key: 'unknown',
  name: 'Unknown Type',
  cssClass: 'icon-object-unknown'
});

/**
 * @typedef TypeDefinition
 * @memberof module:openmct.TypeRegistry~
 * @property {string} label the name for this type of object
 * @property {string} description a longer-form description of this type
 * @property {function (object)} [initialize] a function which initializes
 *           the model for new domain objects of this type
 * @property {boolean} [creatable] true if users should be allowed to
 *           create this type (default: false)
 * @property {string} [cssClass] the CSS class to apply for icons
 */

/**
 * A TypeRegistry maintains the definitions for different types
 * that domain objects may have.
 * @interface TypeRegistry
 * @memberof module:openmct
 */
export default class TypeRegistry {
  constructor() {
    this.types = {};
  }
  /**
   * Register a new object type.
   *
   * @param {string} typeKey a string identifier for this type
   * @param {module:openmct.Type} type the type to add
   * @method addType
   * @memberof module:openmct.TypeRegistry#
   */
  addType(typeKey, typeDef) {
    this.standardizeType(typeDef);
    this.types[typeKey] = new Type(typeDef);
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
  /**
   * List keys for all registered types.
   * @method listKeys
   * @memberof module:openmct.TypeRegistry#
   * @returns {string[]} all registered type keys
   */
  listKeys() {
    return Object.keys(this.types);
  }
  /**
   * Retrieve a registered type by its key.
   * @method get
   * @param {string} typeKey the key for this type
   * @memberof module:openmct.TypeRegistry#
   * @returns {module:openmct.Type} the registered type
   */
  get(typeKey) {
    return this.types[typeKey] || UNKNOWN_TYPE;
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
