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
 * @typedef {import('openmct').OpenMCT} OpenMCT
 * @typedef {import('openmct').Identifier} Identifier
 * @typedef {string} Status
 */

import EventEmitter from 'EventEmitter';
/**
 * Get, set, and observe statuses for Open MCT objects. A status is a string
 * that represents the current state of an object.
 *
 * @extends EventEmitter
 */
export default class StatusAPI extends EventEmitter {
  /**
   * Constructs a new instance of the StatusAPI class.
   * @param {OpenMCT} openmct - The Open MCT application instance.
   */
  constructor(openmct) {
    super();

    this._openmct = openmct;
    /** @type {Record<string, Status>} */
    this._statusCache = {};

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.observe = this.observe.bind(this);
  }

  /**
   * Retrieves the status of the object with the given identifier.
   * @param {Identifier} identifier - The identifier of the object.
   * @returns {Status | undefined} The status of the object, or undefined if the object's status is not cached.
   */
  get(identifier) {
    let keyString = this._openmct.objects.makeKeyString(identifier);

    return this._statusCache[keyString];
  }

  /**
   * Sets the status of the object with the given identifier.
   * @param {Identifier} identifier - The identifier of the object.
   * @param {Status} status - The new status value for the object.
   */
  set(identifier, status) {
    let keyString = this._openmct.objects.makeKeyString(identifier);

    this._statusCache[keyString] = status;
    this.emit(keyString, status);
  }

  /**
   * Deletes the status of the object with the given identifier.
   * @param {Identifier} identifier - The identifier of the object.
   */
  delete(identifier) {
    let keyString = this._openmct.objects.makeKeyString(identifier);

    this._statusCache[keyString] = undefined;
    this.emit(keyString, undefined);
    delete this._statusCache[keyString];
  }

  /**
   * Observes the status of the object with the given identifier, and calls the provided callback
   * function whenever the status changes.
   * @param {Identifier} identifier - The identifier of the object.
   * @param {(value: any) => void} callback - The function to be called whenever the status changes.
   * @returns {() => void} A function that can be called to stop observing the status.
   */
  observe(identifier, callback) {
    let key = this._openmct.objects.makeKeyString(identifier);

    this.on(key, callback);

    return () => {
      this.off(key, callback);
    };
  }
}
