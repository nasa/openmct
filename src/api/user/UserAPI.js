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

import { EventEmitter } from 'eventemitter3';

import { MULTIPLE_PROVIDER_ERROR, NO_PROVIDER_ERROR } from './constants.js';
import StatusAPI from './StatusAPI.js';
import StoragePersistence from './StoragePersistence.js';
import User from './User.js';

class UserAPI extends EventEmitter {
  /**
   * @type {OpenMCT}
   */
  #openmct;
  /**
   * @param {OpenMCT} openmct
   */
  constructor(openmct) {
    super();

    this.#openmct = openmct;
    this._provider = undefined;

    this.User = User;
    this.status = new StatusAPI(this, openmct);
  }

  /**
   * Set the user provider for the user API. This allows you
   *  to specify ONE user provider to be used with Open MCT.
   * @method setProvider
   * @param {module:openmct.UserAPI~UserProvider} provider the new
   *        user provider
   */
  setProvider(provider) {
    if (this.hasProvider()) {
      this.error(MULTIPLE_PROVIDER_ERROR);
    }

    this._provider = provider;
    this.emit('providerAdded', this._provider);
  }

  getProvider() {
    return this._provider;
  }

  /**
   * Return true if the user provider has been set.
   *
   * @returns {boolean} true if the user provider exists
   */
  hasProvider() {
    return this._provider !== undefined;
  }

  /**
   * If a user provider is set, it will return a copy of a user object from
   * the provider. If the user is not logged in, it will return undefined;
   *
   * @returns {Function|Promise} user provider 'getCurrentUser' method
   * @throws Will throw an error if no user provider is set
   */
  getCurrentUser() {
    if (!this.hasProvider()) {
      return Promise.resolve(undefined);
    } else {
      return this._provider.getCurrentUser();
    }
  }
  /**
   *  If a user provider is set, it will return an array of possible roles
   *  that can be selected by the current user
   *  @returns {Array}
   *  @throws Will throw an error if no user provider is set
   */

  getPossibleRoles() {
    if (!this.hasProvider()) {
      this.error(NO_PROVIDER_ERROR);
    }
    return this._provider.getPossibleRoles();
  }
  /**
   * If a user provider is set, it will return the active role or null
   * @returns {string|null}
   */
  getActiveRole() {
    if (!this.hasProvider()) {
      return null;
    }

    // get from session storage
    const sessionStorageValue = StoragePersistence.getActiveRole();

    return sessionStorageValue;
  }
  /**
   * Set the active role in session storage
   * @returns {undefined}
   */
  setActiveRole(role) {
    if (!role) {
      StoragePersistence.clearActiveRole();
    } else {
      StoragePersistence.setActiveRole(role);
    }
    this.emit('roleChanged', role);
  }

  /**
   * Will return if a role can provide a operator status response
   * @returns {boolean}
   */
  canProvideStatusForRole() {
    if (!this.hasProvider()) {
      return null;
    }
    const activeRole = this.getActiveRole();

    return this._provider.canProvideStatusForRole?.(activeRole);
  }

  /**
   * If a user provider is set, it will return the user provider's
   * 'isLoggedIn' method
   *
   * @returns {Function|Boolean} user provider 'isLoggedIn' method
   * @throws Will throw an error if no user provider is set
   */
  isLoggedIn() {
    if (!this.hasProvider()) {
      return false;
    }

    return this._provider.isLoggedIn();
  }

  /**
   * If a user provider is set, it will return a call to it's
   * 'hasRole' method
   *
   * @returns {Function|boolean} user provider 'isLoggedIn' method
   * @param {string} roleId id of role to check for
   * @throws Will throw an error if no user provider is set
   */
  hasRole(roleId) {
    this.noProviderCheck();

    return this._provider.hasRole(roleId);
  }

  /**
   * Checks if a provider is set and if not, will throw error
   *
   * @private
   * @throws Will throw an error if no user provider is set
   */
  noProviderCheck() {
    if (!this.hasProvider()) {
      this.error(NO_PROVIDER_ERROR);
    }
  }

  /**
   * Utility function for throwing errors
   *
   * @private
   * @param {string} error description of error
   * @throws Will throw error passed in
   */
  error(error) {
    throw new Error(error);
  }
}

export default UserAPI;

/**
 * @typedef {string} Role
 * @typedef {import('../../MCT.js').MCT} OpenMCT
 * @typedef {{statusStyles: Record<string, StatusStyleDefinition>}} UserAPIConfiguration
 * @typedef {Object} UserProvider
 */

/**
 * @typedef {Object} StatusStyleDefinition
 * @property {string} iconClass The icon class to apply to the status indicator when this status is active "icon-circle-slash",
 * @property {string} iconClassPoll The icon class to apply to the poll question indicator when this style is active eg. "icon-status-poll-question-mark"
 * @property {string} statusClass The class to apply to the indicator when this status is active eg. "s-status-error"
 * @property {string} statusBgColor The background color to apply in the status summary section of the poll question popup for this status eg."#9900cc"
 * @property {string} statusFgColor The foreground color to apply in the status summary section of the poll question popup for this status eg. "#fff"
 */
