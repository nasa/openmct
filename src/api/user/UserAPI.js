/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import EventEmitter from 'EventEmitter';
import {
    MULTIPLE_PROVIDER_ERROR,
    NO_PROVIDER_ERROR
} from './constants';
import User from './User';

class UserAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this._openmct = openmct;
        this._provider = undefined;

        this.User = User;
    }

    /**
     * Set the user provider for the user API. This allows you
     *  to specifiy ONE user provider to be used with Open MCT.
     * @method setProvider
     * @memberof module:openmct.UserAPI#
     * @param {module:openmct.UserAPI~UserProvider} provider the new
     *        user provider
     */
    setProvider(provider) {
        if (this.hasProvider()) {
            this._error(MULTIPLE_PROVIDER_ERROR);
        }

        this._provider = provider;

        this.emit('providerAdded', this._provider);
    }

    /**
     * Return true if the user provider has been set.
     *
     * @memberof module:openmct.UserAPI#
     * @returns {boolean} true if the user provider exists
     */
    hasProvider() {
        return this._provider !== undefined;
    }

    /**
     * If a user provider is set, it will return a copy of a user object from
     * the provider. If the user is not logged in, it will return undefined;
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Function|Promise} user provider 'getCurrentUser' method
     * @throws Will throw an error if no user provider is set
     */
    getCurrentUser() {
        this._noProviderCheck();

        return this._provider.getCurrentUser();
    }

    /**
     * If a user provider is set, it will return the user provider's
     * 'isLoggedIn' method
     *
     * @memberof module:openmct.UserAPI#
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
     * @memberof module:openmct.UserAPI#
     * @returns {Function|Boolean} user provider 'isLoggedIn' method
     * @param {string} roleId id of role to check for
     * @throws Will throw an error if no user provider is set
     */
    hasRole(roleId) {
        this._noProviderCheck();

        return this._provider.hasRole(roleId);
    }

    /**
     * Checks if a provider is set and if not, will throw error
     *
     * @private
     * @throws Will throw an error if no user provider is set
     */
    _noProviderCheck() {
        if (!this.hasProvider()) {
            this._error(NO_PROVIDER_ERROR);
        }
    }

    /**
     * Utility function for throwing errors
     *
     * @private
     * @param {string} error description of error
     * @throws Will throw error passed in
     */
    _error(error) {
        throw new Error(error);
    }
}

export default UserAPI;
