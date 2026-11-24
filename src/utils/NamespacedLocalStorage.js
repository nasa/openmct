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
 * Utility for managing LocalStorage with namespace isolation
 * Allows multiple Open MCT instances on the same host/port without conflicts
 */
class NamespacedLocalStorage {
  /**
   * @param {string} namespace Prefixo para todas as chaves de localStorage
   * @param {Storage} storageInterface Interface de storage (padrão: window.localStorage)
   */
  constructor(namespace = '', storageInterface = window.localStorage) {
    this.namespace = namespace ? `${namespace}:` : '';
    this.storage = storageInterface;
  }

  /**
   * Adds namespace prefix to key
   * @param {string} key Original key
   * @returns {string} Key with namespace prefix
   */
  getNamespacedKey(key) {
    return `${this.namespace}${key}`;
  }

  /**
   * Gets value from localStorage
   * @param {string} key Key
   * @returns {string|null} Stored value or null
   */
  getItem(key) {
    return this.storage.getItem(this.getNamespacedKey(key));
  }

  /**
   * Sets value in localStorage
   * @param {string} key Key
   * @param {string} value Value
   */
  setItem(key, value) {
    this.storage.setItem(this.getNamespacedKey(key), value);
  }

  /**
   * Removes item from localStorage
   * @param {string} key Key
   */
  removeItem(key) {
    this.storage.removeItem(this.getNamespacedKey(key));
  }

  /**
   * Clears all keys with the current namespace prefix
   */
  clear() {
    const keys = Object.keys(this.storage);
    const prefix = this.namespace;
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        this.storage.removeItem(key);
      }
    });
  }

  /**
   * Checks if a key exists
   * @param {string} key Key
   * @returns {boolean} true if the key exists
   */
  hasItem(key) {
    return this.getItem(key) !== null;
  }
}

export default NamespacedLocalStorage;
