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
import uuid from 'uuid';
import createExampleUser from './exampleUserCreator';

export default class ExampleUserProvider extends EventEmitter {
    constructor(openmct) {
        super();

        this.openmct = openmct;
        this.user = undefined;
        this.loggedIn = false;

        this.ExampleUser = createExampleUser(this.openmct.user.User);
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    getCurrentUser() {
        if (this.loggedIn) {
            return Promise.resolve(this.user.getUserInfo());
        }

        return this._login().then(() => this.user.getUserInfo());
    }

    hasRole(roleId) {
        if (!this.loggedIn) {
            Promise.resolve(undefined);
        }

        return Promise.resolve(this.user.getRoles().includes(roleId));
    }

    _login() {
        const id = uuid();
        const loginPromise = new Promise((resolve, reject) => {
            let overlay = this.openmct.overlays.overlay({
                element: this._getLoginForm(),
                dismissable: false,
                size: 'small',
                buttons: [
                    {
                        label: 'Login',
                        emphasis: 'true',
                        callback: () => {
                            let username = document.getElementById('example-user-form-username').value;

                            if (username !== '') {
                                this.user = new this.ExampleUser(id, username, ['example-role']);
                                this.loggedIn = true;
                                resolve();
                                overlay.dismiss();
                            } else {
                                this.openmct.notifications.info('Please enter a username.');
                            }
                        }
                    }
                ],
                onDestroy: () => this.loginForm = undefined
            });
        });

        return loginPromise;
    }

    logout() {
        this.loggedIn = false;

        return Promise.resolve('logout');
    }

    _getLoginForm() {
        let div = document.createElement('div');
        div.innerHTML = `
            <div id="loginForm" class="form">
                <div class="c-overlay__dialog-title">
                    Please enter your username and password.
                </div>
                <div class="form-row">
                    <div class="c-form__row__label">Username</div>
                    <input id="example-user-form-username" class="c-form__row__controls" type="text" />
                </div>
            </div>
        `.trim();

        return div.firstChild;
    }
}
