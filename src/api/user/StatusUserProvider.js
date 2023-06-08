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
import UserProvider from './UserProvider';

export default class StatusUserProvider extends UserProvider {
  /**
   * @param {('statusChange'|'pollQuestionChange')} event the name of the event to listen to
   * @param {Function} callback a function to invoke when this event occurs
   */
  on(event, callback) {}
  /**
   * @param {('statusChange'|'pollQuestionChange')} event the name of the event to stop listen to
   * @param {Function} callback the callback function used to register the listener
   */
  off(event, callback) {}
  /**
   * @returns {import("./StatusAPI").PollQuestion} the current status poll question
   */
  async getPollQuestion() {}
  /**
   * @param {import("./StatusAPI").PollQuestion} pollQuestion a new poll question to set
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false
   */
  async setPollQuestion(pollQuestion) {}
  /**
   * @returns {Promise<Boolean>} true if the current user can set the poll question, otherwise false
   */
  async canSetPollQuestion() {}
  /**
   * @returns {Promise<Array<import("./StatusAPI").Status>>} a list of the possible statuses that an operator can be in
   */
  async getPossibleStatuses() {}
  /**
   * @param {import("./UserAPI").Role} role
   * @returns {Promise<import("./StatusAPI").Status}
   */
  async getStatusForRole(role) {}
  /**
   * @param {import("./UserAPI").Role} role
   * @returns {Promise<import("./StatusAPI").Status}
   */
  async getDefaultStatusForRole(role) {}
  /**
   * @param {import("./UserAPI").Role} role
   * @param {*} status
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  async setStatusForRole(role, status) {}
  /**
   * @param {import("./UserAPI").Role} role
   * @returns {Promise<Boolean} true if the user provider can provide status for the given role
   */
  async canProvideStatusForRole(role) {}
  /**
   * @returns {Promise<Array<import("./UserAPI").Role>>} a list of all available status roles, if user permissions allow it.
   */
  async getAllStatusRoles() {}
  /**
   * @returns {Promise<import("./UserAPI").Role>} the active status role for the currently logged in user
   */
  async getStatusRoleForCurrentUser() {}
}
