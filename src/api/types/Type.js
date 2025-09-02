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

/**
 * A Type describes a kind of domain object that may appear or be
 * created within Open MCT.
 */
export default class Type {
  /**
   * @param {TypeDefinition} definition
   */
  constructor(definition) {
    this.definition = definition;
    if (definition.key) {
      this.key = definition.key;
    }
  }
  /**
   * Convert a legacy type definition to the new format.
   * @param {LegacyTypeDefinition} legacyDefinition
   * @returns {TypeDefinition}
   */
  static definitionFromLegacyDefinition(legacyDefinition) {
    let definition = {};
    definition.name = legacyDefinition.name;
    definition.cssClass = legacyDefinition.cssClass;
    definition.description = legacyDefinition.description;
    definition.form = legacyDefinition.properties;
    if (legacyDefinition.telemetry !== undefined) {
      let telemetry = {
        values: []
      };

      if (legacyDefinition.telemetry.domains !== undefined) {
        legacyDefinition.telemetry.domains.forEach((domain, index) => {
          domain.hints = {
            domain: index
          };
          telemetry.values.push(domain);
        });
      }

      if (legacyDefinition.telemetry.ranges !== undefined) {
        legacyDefinition.telemetry.ranges.forEach((range, index) => {
          range.hints = {
            range: index
          };
          telemetry.values.push(range);
        });
      }

      definition.telemetry = telemetry;
    }

    if (legacyDefinition.model) {
      definition.initialize = function (model) {
        for (let [k, v] of Object.entries(legacyDefinition.model)) {
          model[k] = JSON.parse(JSON.stringify(v));
        }
      };
    }

    if (legacyDefinition.features && legacyDefinition.features.includes('creation')) {
      definition.creatable = true;
    }

    return definition;
  }
  /**
   * Check if a domain object is an instance of this type.
   * @param {DomainObject} domainObject
   * @returns {boolean} true if the domain object is of this type
   */
  check(domainObject) {
    // Depends on assignment from MCT.
    return domainObject.type === this.key;
  }
  /**
   * Get a definition for this type that can be registered using the
   * legacy bundle format.
   * @private
   */
  toLegacyDefinition() {
    const def = {};
    def.name = this.definition.name;
    def.cssClass = this.definition.cssClass;
    def.description = this.definition.description;
    def.properties = this.definition.form;

    if (this.definition.initialize) {
      def.model = {};
      this.definition.initialize(def.model);
    }

    if (this.definition.creatable) {
      def.features = ['creation'];
    }

    return def;
  }
}

/**
 * @typedef {Object} TypeDefinition
 * @property {string} [key]
 * @property {string} name
 * @property {string} cssClass
 * @property {string} description
 * @property {Form} form
 * @property {Telemetry} telemetry
 * @property {function(Object): void} initialize
 * @property {boolean} creatable
 */

/**
 * @typedef {import('openmct').DomainObject} DomainObject
 */
