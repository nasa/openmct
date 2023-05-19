/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import { v4 as uuid } from 'uuid';
import createExampleUser from './exampleUserCreator';

const STATUSES = [
  {
    key: 'NO_STATUS',
    label: 'Not set',
    iconClass: 'icon-question-mark',
    iconClassPoll: 'icon-status-poll-question-mark'
  },
  {
    key: 'GO',
    label: 'Go',
    iconClass: 'icon-check',
    iconClassPoll: 'icon-status-poll-question-mark',
    statusClass: 's-status-ok',
    statusBgColor: '#33cc33',
    statusFgColor: '#000'
  },
  {
    key: 'MAYBE',
    label: 'Maybe',
    iconClass: 'icon-alert-triangle',
    iconClassPoll: 'icon-status-poll-question-mark',
    statusClass: 's-status-warning',
    statusBgColor: '#ffb66c',
    statusFgColor: '#000'
  },
  {
    key: 'NO_GO',
    label: 'No go',
    iconClass: 'icon-circle-slash',
    iconClassPoll: 'icon-status-poll-question-mark',
    statusClass: 's-status-error',
    statusBgColor: '#9900cc',
    statusFgColor: '#fff'
  }
];
/**
 * @implements {StatusUserProvider}
 */
export default class ExampleUserProvider extends EventEmitter {
  constructor(openmct, { defaultStatusRole } = { defaultStatusRole: undefined }) {
    super();

    this.openmct = openmct;
    this.user = undefined;
    this.loggedIn = false;
    this.autoLoginUser = undefined;
    this.status = STATUSES[0];
    this.pollQuestion = undefined;
    this.defaultStatusRole = defaultStatusRole;

    this.ExampleUser = createExampleUser(this.openmct.user.User);
    this.loginPromise = undefined;
  }

  isLoggedIn() {
    return this.loggedIn;
  }

  autoLogin(username) {
    this.autoLoginUser = username;
  }

  getCurrentUser() {
    if (!this.loginPromise) {
      this.loginPromise = this._login().then(() => this.user);
    }

    return this.loginPromise;
  }

  canProvideStatusForRole() {
    return Promise.resolve(true);
  }

  canSetPollQuestion() {
    return Promise.resolve(true);
  }

  hasRole(roleId) {
    if (!this.loggedIn) {
      Promise.resolve(undefined);
    }

    return Promise.resolve(this.user.getRoles().includes(roleId));
  }

  getStatusRoleForCurrentUser() {
    return Promise.resolve(this.defaultStatusRole);
  }

  getAllStatusRoles() {
    return Promise.resolve([this.defaultStatusRole]);
  }

  getStatusForRole(role) {
    return Promise.resolve(this.status);
  }

  async getDefaultStatusForRole(role) {
    const allRoles = await this.getPossibleStatuses();

    return allRoles?.[0];
  }

  setStatusForRole(role, status) {
    status.timestamp = Date.now();
    this.status = status;
    this.emit('statusChange', {
      role,
      status
    });

    return true;
  }

  // eslint-disable-next-line require-await
  async getPollQuestion() {
    if (this.pollQuestion) {
      return this.pollQuestion;
    } else {
      return undefined;
    }
  }

  setPollQuestion(pollQuestion) {
    if (!pollQuestion) {
      // If the poll question is undefined, set it to a blank string.
      // This behavior better reflects how other telemetry systems
      // deal with undefined poll questions.
      pollQuestion = '';
    }

    this.pollQuestion = {
      question: pollQuestion,
      timestamp: Date.now()
    };
    this.emit('pollQuestionChange', this.pollQuestion);

    return true;
  }

  getPossibleStatuses() {
    return Promise.resolve(STATUSES);
  }

  _login() {
    const id = uuid();

    // for testing purposes, this will skip the form, this wouldn't be used in
    // a normal authentication process
    if (this.autoLoginUser) {
      this.user = new this.ExampleUser(id, this.autoLoginUser, ['example-role']);
      this.loggedIn = true;

      return Promise.resolve();
    }

    const formStructure = {
      title: 'Login',
      sections: [
        {
          rows: [
            {
              key: 'username',
              control: 'textfield',
              name: 'Username',
              pattern: '\\S+',
              required: true,
              cssClass: 'l-input-lg',
              value: ''
            }
          ]
        }
      ],
      buttons: {
        submit: {
          label: 'Login'
        }
      }
    };

    return this.openmct.forms.showForm(formStructure).then(
      (info) => {
        this.user = new this.ExampleUser(id, info.username, ['example-role']);
        this.loggedIn = true;
      },
      () => {
        // user canceled, setting a default username
        this.user = new this.ExampleUser(id, 'Pat', ['example-role']);
        this.loggedIn = true;
      }
    );
  }
}
/**
 * @typedef {import('@/api/user/StatusUserProvider').default} StatusUserProvider
 */
