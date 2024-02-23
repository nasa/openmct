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
import EventEmitter from 'EventEmitter';

/**
 * The StatusAPI is used to get and set various statuses linked to the current logged in user.
 * This includes the ability to set the status of the current user as a response to a poll question,
 * set the poll question itself, and the ability to set the status of mission actions.
 *
 * @augments EventEmitter
 */
export default class StatusAPI extends EventEmitter {
  /** @type {UserAPI} */
  #userAPI;
  /** @type {OpenMCT} */
  #openmct;

  /**
   * @param {UserAPI} userAPI
   * @param {OpenMCT} openmct
   */
  constructor(userAPI, openmct) {
    super();
    this.#userAPI = userAPI;
    this.#openmct = openmct;

    this.onProviderStatusChange = this.onProviderStatusChange.bind(this);
    this.onProviderPollQuestionChange = this.onProviderPollQuestionChange.bind(this);
    this.onMissionActionStatusChange = this.onMissionActionStatusChange.bind(this);
    this.listenToStatusEvents = this.listenToStatusEvents.bind(this);

    this.#openmct.once('destroy', () => {
      const provider = this.#userAPI.getProvider();

      if (typeof provider?.off === 'function') {
        provider.off('statusChange', this.onProviderStatusChange);
        provider.off('pollQuestionChange', this.onProviderPollQuestionChange);
        provider.off('missionActionStatusChange', this.onMissionActionStatusChange);
      }
    });

    this.#userAPI.on('providerAdded', this.listenToStatusEvents);
  }

  /**
   * Fetch the currently defined operator status poll question. When presented with a status poll question, all operators will reply with their current status.
   * @returns {Promise<PollQuestion>}
   */
  getPollQuestion() {
    const provider = this.#userAPI.getProvider();

    if (provider.getPollQuestion) {
      return provider.getPollQuestion();
    } else {
      this.#userAPI.error('User provider does not support polling questions');
    }
  }

  /**
   * Set a poll question for operators to respond to. When presented with a status poll question, all operators will reply with their current status.
   * @param {string} questionText - The text of the question
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  async setPollQuestion(questionText) {
    const canSetPollQuestion = await this.canSetPollQuestion();

    if (canSetPollQuestion) {
      const provider = this.#userAPI.getProvider();

      const result = await provider.setPollQuestion(questionText);

      try {
        await this.resetAllStatuses();
      } catch (error) {
        console.warn('Poll question set but unable to clear operator statuses.');
        console.error(error);
      }

      return result;
    } else {
      this.#userAPI.error('User provider does not support setting polling question');
    }
  }

  /**
   * Can the currently logged in user set the operator status poll question.
   * @returns {Promise<Boolean>}
   */
  canSetPollQuestion() {
    const provider = this.#userAPI.getProvider();

    if (provider.canSetPollQuestion) {
      return provider.canSetPollQuestion();
    } else {
      return Promise.resolve(false);
    }
  }

  /**
   * Can the currently logged in user set the mission status.
   * @returns {Promise<Boolean>} true if the currently logged in user can set the mission status, false otherwise.
   */
  canSetMissionStatus() {
    const provider = this.#userAPI.getProvider();

    if (provider.canSetMissionStatus) {
      return provider.canSetMissionStatus();
    } else {
      return Promise.resolve(false);
    }
  }

  /**
   * Fetch the current status for the given mission action
   * @param {MissionAction} action
   * @returns {string}
   */
  getStatusForMissionAction(action) {
    const provider = this.#userAPI.getProvider();

    if (provider.getStatusForMissionAction) {
      return provider.getStatusForMissionAction(action);
    } else {
      this.#userAPI.error('User provider does not support getting mission action status');
    }
  }

  /**
   * Fetch the list of possible mission status options (GO, NO-GO, etc.)
   * @returns {Promise<MissionStatusOption[]>} the complete list of possible mission statuses
   */
  async getPossibleMissionActionStatuses() {
    const provider = this.#userAPI.getProvider();

    if (provider.getPossibleMissionActionStatuses) {
      const possibleOptions = await provider.getPossibleMissionActionStatuses();

      return possibleOptions;
    } else {
      this.#userAPI.error('User provider does not support mission status options');
    }
  }

  /**
   * Fetch the list of possible mission actions
   * @returns {Promise<string[]>} the list of possible mission actions
   */
  async getPossibleMissionActions() {
    const provider = this.#userAPI.getProvider();

    if (provider.getPossibleMissionActions) {
      const possibleActions = await provider.getPossibleMissionActions();

      return possibleActions;
    } else {
      this.#userAPI.error('User provider does not support mission statuses');
    }
  }

  /**
   * @returns {Promise<Array<Status>>} the complete list of possible states that an operator can reply to a poll question with.
   */
  async getPossibleStatuses() {
    const provider = this.#userAPI.getProvider();

    if (provider.getPossibleStatuses) {
      const possibleStatuses = (await provider.getPossibleStatuses()) || [];

      return possibleStatuses.map((status) => status);
    } else {
      this.#userAPI.error('User provider cannot provide statuses');
    }
  }

  /**
   * @param {import("./UserAPI").Role} role The role to fetch the current status for.
   * @returns {Promise<Status>} the current status of the provided role
   */
  async getStatusForRole(role) {
    const provider = this.#userAPI.getProvider();

    if (provider.getStatusForRole) {
      const status = await provider.getStatusForRole(role);

      return status;
    } else {
      this.#userAPI.error('User provider does not support role status');
    }
  }

  /**
   * @param {import("./UserAPI").Role} role
   * @returns {Promise<Boolean>} true if the configured UserProvider can provide status for the given role
   * @see StatusUserProvider
   */
  canProvideStatusForRole(role) {
    const provider = this.#userAPI.getProvider();

    if (provider.canProvideStatusForRole) {
      return Promise.resolve(provider.canProvideStatusForRole(role));
    } else {
      return Promise.resolve(false);
    }
  }

  /**
   * @param {import("./UserAPI").Role} role The role to set the status for.
   * @param {Status} status The status to set for the provided role
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  setStatusForRole(status) {
    const provider = this.#userAPI.getProvider();

    if (provider.setStatusForRole) {
      const activeRole = this.#userAPI.getActiveRole();
      if (!provider.canProvideStatusForRole(activeRole)) {
        return false;
      }

      return provider.setStatusForRole(activeRole, status);
    } else {
      this.#userAPI.error('User provider does not support setting role status');
    }
  }

  /**
   * @param {MissionAction} action
   * @param {MissionStatusOption} status
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  setStatusForMissionAction(action, status) {
    const provider = this.#userAPI.getProvider();

    if (provider.setStatusForMissionAction) {
      return provider.setStatusForMissionAction(action, status);
    } else {
      this.#userAPI.error('User provider does not support setting mission role status');
    }
  }

  /**
   * Resets the status of the provided role back to its default status.
   * @param {import("./UserAPI").Role} role The role to set the status for.
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  async resetStatusForRole(role) {
    const provider = this.#userAPI.getProvider();
    const defaultStatus = await this.getDefaultStatusForRole(role);

    if (provider.setStatusForRole) {
      return provider.setStatusForRole(role, defaultStatus);
    } else {
      this.#userAPI.error('User provider does not support resetting role status');
    }
  }

  /**
   * Resets the status of all operators to their default status
   * @returns {Promise<Boolean>} true if operation was successful, otherwise false.
   */
  async resetAllStatuses() {
    const allStatusRoles = await this.getAllStatusRoles();

    return Promise.all(allStatusRoles.map((role) => this.resetStatusForRole(role)));
  }

  /**
   * The default status. This is the status that will be used before the user has selected any status.
   * @param {import("./UserAPI").Role} role
   * @returns {Promise<Status>} the default operator status if no other has been set.
   */
  async getDefaultStatusForRole(role) {
    const provider = this.#userAPI.getProvider();
    const defaultStatus = await provider.getDefaultStatusForRole(role);

    return defaultStatus;
  }

  /**
   * All possible status roles. A status role is a user role that can provide status. In some systems
   * this may be all user roles, but there may be cases where some users are not are not polled
   * for status if they do not have a real-time operational role.
   *
   * @returns {Promise<Array<import("./UserAPI").Role>>} the default operator status if no other has been set.
   */
  getAllStatusRoles() {
    const provider = this.#userAPI.getProvider();

    if (provider.getAllStatusRoles) {
      return provider.getAllStatusRoles();
    } else {
      this.#userAPI.error('User provider cannot provide all status roles');
    }
  }

  /**
   * @returns {Promise<Boolean>} true if the configured UserProvider can provide status for the currently logged in user, false otherwise.
   * @see StatusUserProvider
   */
  async canProvideStatusForCurrentUser() {
    const provider = this.#userAPI.getProvider();

    if (!provider) {
      return false;
    }
    const activeStatusRole = await this.#userAPI.getActiveRole();
    const canProvideStatus = await this.canProvideStatusForRole(activeStatusRole);

    return canProvideStatus;
  }

  /**
   * Listen to status events from the UserProvider
   * @private
   */
  listenToStatusEvents(provider) {
    if (typeof provider.on === 'function') {
      provider.on('statusChange', this.onProviderStatusChange);
      provider.on('pollQuestionChange', this.onProviderPollQuestionChange);
      provider.on('missionActionStatusChange', this.onMissionActionStatusChange);
    }
  }

  /**
   * Emit a status change event
   * @private
   */
  onProviderStatusChange(newStatus) {
    this.emit('statusChange', newStatus);
  }

  /**
   * Emit a poll question change event
   * @private
   */
  onProviderPollQuestionChange(pollQuestion) {
    this.emit('pollQuestionChange', pollQuestion);
  }

  /**
   * Emit a mission action status change event
   * @private
   */
  onMissionActionStatusChange({ action, status }) {
    this.emit('missionActionStatusChange', { action, status });
  }
}

/**
 * @typedef {import('./UserAPI').default} UserAPI
 */

/**
 * @typedef {import('../../../openmct').OpenMCT} OpenMCT
 */

/**
 * @typedef {import('./UserProvider')} UserProvider
 */

/**
 * @typedef {import('./StatusUserProvider')} StatusUserProvider
 */

/**
 * The PollQuestion type
 * @typedef {Object} PollQuestion
 * @property {string} question - The question to be presented to users
 * @property {number} timestamp - The time that the poll question was set.
 */

/**
 * @typedef {Object} MissionAction
 * @property {string} key A unique identifier for this action
 * @property {string} label A human readable label for this action
 */

/**
 * The MissionStatusOption type, extends Status.
 * @typedef {Object} MissionStatusOption
 * @property {string} key - A unique identifier for this status.
 * @property {string} label - A human-readable label for this status.
 * @property {number} timestamp - The time that the status was set.
 * @property {string} color - A color to be used when displaying the mission status.
 */

/**
 * The Status type
 * @typedef {Object} Status
 * @property {string} key - A unique identifier for this status
 * @property {string} label - A human readable label for this status
 * @property {number} timestamp - The time that the status was set.
 */
