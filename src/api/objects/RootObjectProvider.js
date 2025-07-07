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
 * Provides the root object for the Open MCT application.
 */
class RootObjectProvider {
  /**
   * @param {RootRegistry} rootRegistry - The registry containing root objects.
   */
  constructor(rootRegistry) {
    if (!RootObjectProvider.instance) {
      this.rootRegistry = rootRegistry;
      this.rootObject = {
        identifier: {
          key: 'ROOT',
          namespace: ''
        },
        name: 'Open MCT',
        type: 'root',
        composition: []
      };
      RootObjectProvider.instance = this;
    } else if (rootRegistry) {
      // if called twice, update instance rootRegistry
      RootObjectProvider.instance.rootRegistry = rootRegistry;
    }

    return RootObjectProvider.instance; // eslint-disable-line no-constructor-return
  }

  /**
   * Updates the name of the root object.
   * @param {string} name - The new name for the root object.
   */
  updateName(name) {
    this.rootObject.name = name;
  }

  /**
   * Retrieves the root object with updated composition.
   * @returns {Promise<RootObject>} A promise that resolves to the root object.
   */
  async get() {
    let roots = await this.rootRegistry.getRoots();
    this.rootObject.composition = roots;

    return this.rootObject;
  }
}

/**
 * Creates or returns an instance of RootObjectProvider.
 * @param {RootRegistry} rootRegistry - The registry containing root objects.
 * @returns {RootObjectProvider} An instance of RootObjectProvider.
 */
function instance(rootRegistry) {
  return new RootObjectProvider(rootRegistry);
}

export default instance;

/**
 * @typedef {import('openmct').Identifier} Identifier
 */

/**
 * @typedef {Object} RootObject
 * @property {Identifier} identifier - The identifier of the root object.
 * @property {string} name - The name of the root object.
 * @property {string} type - The type of the root object.
 * @property {Identifier[]} composition - The composition of the root object.
 */

/**
 * @typedef {Object} RootRegistry
 * @property {() => Promise<Identifier[]>} getRoots - A method that returns a promise resolving to an array of root identifiers.
 */
