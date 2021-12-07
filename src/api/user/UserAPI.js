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
    NO_PROVIDER_ERROR,
    NO_LOGIN_LOGOUT
} from './constants';

export default class UserAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this._openmct = openmct;
        this._provider = undefined;
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
     * If a user provider is set, it will return true
     * if the user provider has set a 'supportsLoginLogout' value.
     *
     * @memberof module:openmct.UserAPI#
     * @returns {boolean} true if the user provider exists
     * @throws Will throw an error if no user provider is set
     */
    supportsLoginLogout() {
        this._noProviderCheck();

        return this._provider.supportsLoginLogout;
    }

    /**
     * If a user provider is set, it will return a copy of a user object from
     * the provider. If the user is not logged in, it will return undefined;
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Promise} Promise object represents user information
     * @throws Will throw an error if no user provider is set
     */
    getCurrentUser() {
        this._noProviderCheck();

        if (!this.isLoggedIn()) {
            return Promise.resolve(undefined);
        } else {
            return this._provider.getCurrentUser().then((userInfo) => {
                return JSON.parse(JSON.stringify(userInfo));
            });
        }
    }

    /**
     * Calls the the set user provider's login method. If already logged in
     * will just return a resolved Promise and trigger a notification.
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Promise} Promise object represents user provider login
     * @throws Will throw an error if no user provider is set
     * @throws Will throw an error set user provider does not support login/logout
     */
    login() {
        this._supportsLoginLogoutCheck();

        if (this._provider.isLoggedIn()) {
            this._openmct.notifications.info('A user is already logged in.');

            return Promise.resolve();
        }

        const loginPromise = this._provider.login();

        loginPromise.then(() => {
            this.getCurrentUser().then((user) => {
                if (user) {
                    this.emit('login');
                }
            });
        });

        return loginPromise;
    }

    /**
     * Calls the the set user provider's logout method. If already logged out
     * will just return a resolved Promise and trigger a notification.
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Promise} Promise object represents user provider logout
     * @throws Will throw an error if no user provider is set
     * @throws Will throw an error set user provider does not support login/logout
     */
    logout() {
        this._supportsLoginLogoutCheck();

        if (!this._provider.isLoggedIn()) {
            this._openmct.notifications.info('No current logged in user.');

            return Promise.resolve();
        }

        const logoutPromise = this._provider.logout();

        logoutPromise.then(() => {
            this.getCurrentUser().then((user) => {
                if (!user) {
                    this.emit('logout');
                }
            });
        });

        return logoutPromise;
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
        this._noProviderCheck();

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
     * Checks if a provider is set and if the provider supports login/logout
     * if not, will throw errors
     *
     * @private
     * @throws Will throw an error if no user provider is set
     * @throws Will throw an error set user provider does not support login/logout
     */
    _supportsLoginLogoutCheck() {
        this._noProviderCheck();

        if (!this.supportsLoginLogout()) {
            this._error(NO_LOGIN_LOGOUT);
        }
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
