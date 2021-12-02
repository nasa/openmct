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

    setProvider(provider) {
        if (this.hasProvider()) {
            this._error(MULTIPLE_PROVIDER_ERROR);
        }

        this._provider = provider;

        this.emit('providerAdded', this._provider);
    }

    hasProvider() {
        return this._provider !== undefined;
    }

    // returns a copy of the user information provided
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

    isLoggedIn() {
        this._noProviderCheck();

        return this._provider.isLoggedIn();
    }

    hasRole(roleId) {
        this._noProviderCheck();

        return this._provider.hasRole(roleId);
    }

    _supportsLoginLogoutCheck() {
        this._noProviderCheck();

        if (!this._provider.supportsLoginLogout) {
            this._error(NO_LOGIN_LOGOUT);
        }
    }

    _noProviderCheck() {
        if (!this.hasProvider()) {
            this._error(NO_PROVIDER_ERROR);
        }
    }

    _error(error) {
        throw new Error(error);
    }
}
