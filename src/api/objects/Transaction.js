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
 * Represents a transaction for managing changes to domain objects.
 */
export default class Transaction {
  /**
   * @param {import('./ObjectAPI').default} objectAPI - The object API instance.
   */
  constructor(objectAPI) {
    /** @type {Record<string, DomainObject>} */
    this.dirtyObjects = {};
    /** @type {import('./ObjectAPI').default} */
    this.objectAPI = objectAPI;
  }

  /**
   * Adds an object to the transaction.
   * @param {DomainObject} object - The object to add.
   */
  add(object) {
    const key = this.objectAPI.makeKeyString(object.identifier);

    this.dirtyObjects[key] = object;
  }

  /**
   * Cancels the transaction and reverts changes.
   * @returns {Promise<void[]>}
   */
  cancel() {
    return this._clear();
  }

  /**
   * Commits the transaction and saves changes.
   * @returns {Promise<void[]>}
   */
  commit() {
    const promiseArray = [];
    const save = this.objectAPI.save.bind(this.objectAPI);

    Object.values(this.dirtyObjects).forEach((object) => {
      promiseArray.push(this.createDirtyObjectPromise(object, save));
    });

    return Promise.all(promiseArray);
  }

  /**
   * Creates a promise for handling a dirty object.
   * @template T
   * @param {DomainObject} object - The dirty object.
   * @param {(object: DomainObject, ...args: any[]) => Promise<T>} action - The action to perform.
   * @param {...any} args - Additional arguments for the action.
   * @returns {Promise<T>}
   */
  createDirtyObjectPromise(object, action, ...args) {
    return new Promise((resolve, reject) => {
      action(object, ...args)
        .then((success) => {
          const key = this.objectAPI.makeKeyString(object.identifier);

          delete this.dirtyObjects[key];
          resolve(success);
        })
        .catch(reject);
    });
  }

  /**
   * Retrieves a dirty object by its identifier.
   * @param {Identifier} identifier - The object identifier.
   * @returns {DomainObject | undefined}
   */
  getDirtyObject(identifier) {
    let dirtyObject;

    Object.values(this.dirtyObjects).forEach((object) => {
      const areIdsEqual = this.objectAPI.areIdsEqual(object.identifier, identifier);
      if (areIdsEqual) {
        dirtyObject = object;
      }
    });

    return dirtyObject;
  }

  /**
   * Clears the transaction and refreshes objects.
   * @returns {Promise<void[]>}
   * @private
   */
  _clear() {
    const promiseArray = [];
    const action = (obj) => this.objectAPI.refresh(obj, true);

    Object.values(this.dirtyObjects).forEach((object) => {
      promiseArray.push(this.createDirtyObjectPromise(object, action));
    });

    return Promise.all(promiseArray);
  }
}

/**
 * @typedef {import('openmct').DomainObject} DomainObject
 * @typedef {import('openmct').Identifier} Identifier
 */
