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

import { isIdentifier } from './object-utils.js';

/**
 * Registry for managing root items in Open MCT.
 */
export default class RootRegistry {
  /**
   * @param {OpenMCT} openmct - The Open MCT instance.
   */
  constructor(openmct) {
    /** @type {Array<RootItemEntry>} */
    this._rootItems = [];
    /** @type {OpenMCT} */
    this._openmct = openmct;
  }

  /**
   * Get all registered root items.
   * @returns {Promise<Array<Identifier>>} A promise that resolves to an array of root item identifiers.
   */
  getRoots() {
    const sortedItems = this._rootItems.sort((a, b) => b.priority - a.priority);
    const promises = sortedItems.map((rootItem) => rootItem.provider());

    return Promise.all(promises).then((rootItems) => rootItems.flat());
  }

  /**
   * Add a root item to the registry.
   * @param {RootItemInput} rootItem - The root item to add.
   * @param {number} [priority] - The priority of the root item.
   */
  addRoot(rootItem, priority) {
    if (!this._isValid(rootItem)) {
      return;
    }

    this._rootItems.push({
      priority: priority || this._openmct.priority.DEFAULT,
      provider: typeof rootItem === 'function' ? rootItem : () => rootItem
    });
  }

  /**
   * Validate a root item.
   * @param {RootItemInput} rootItem - The root item to validate.
   * @returns {boolean} True if the root item is valid, false otherwise.
   * @private
   */
  _isValid(rootItem) {
    if (isIdentifier(rootItem) || typeof rootItem === 'function') {
      return true;
    }

    if (Array.isArray(rootItem)) {
      return rootItem.every(isIdentifier);
    }

    return false;
  }
}

/**
 * @typedef {Object} RootItemEntry
 * @property {number} priority - The priority of the root item.
 * @property {() => Promise<Identifier | Identifier[]>} provider - A function that returns a promise resolving to a root item or an array of root items.
 */

/**
 * @typedef {import('openmct').Identifier} Identifier
 * @typedef {Identifier | Identifier[] | (() => Promise<Identifier | Identifier[]>)} RootItemInput
 * @typedef {import('openmct').OpenMCT} OpenMCT
 */
