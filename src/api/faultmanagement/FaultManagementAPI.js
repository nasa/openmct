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

/** @type {ShelveDuration[]} */
export const DEFAULT_SHELVE_DURATIONS = [
  {
    name: '5 Minutes',
    value: 300000
  },
  {
    name: '10 Minutes',
    value: 600000
  },
  {
    name: '15 Minutes',
    value: 900000
  },
  {
    name: 'Unlimited',
    value: null
  }
];

/**
 * Provides an API for managing faults within Open MCT.
 * It allows for the addition of a fault provider, checking for provider support, and
 * performing various operations such as requesting, subscribing to, acknowledging,
 * and shelving faults.
 */
export default class FaultManagementAPI {
  /**
   * @param {import("openmct").OpenMCT} openmct
   */
  constructor(openmct) {
    this.openmct = openmct;
  }

  /**
   * Sets the provider for the Fault Management API.
   * The provider should implement methods for acknowledging and shelving faults.
   *
   * @param {*} provider - The provider to be set.
   */
  addProvider(provider) {
    this.provider = provider;
  }

  /**
   * Checks if the current provider supports fault management actions.
   * Specifically, it checks if the provider has methods for acknowledging and shelving faults.
   *
   * @returns {boolean} - Returns true if the provider supports fault management actions, otherwise false.
   */
  supportsActions() {
    return (
      this.provider?.acknowledgeFault !== undefined && this.provider?.shelveFault !== undefined
    );
  }

  /**
   * Requests fault data for a given domain object.
   * This method checks if the current provider supports the request operation for the given domain object.
   * If supported, it delegates the request to the provider's request method.
   * If not supported, it returns a rejected promise.
   *
   * @param {import('openmct').DomainObject} domainObject - The domain object for which fault data is requested.
   * @returns {Promise.<FaultAPIResponse[]>} - A promise that resolves to an array of fault API responses.
   */
  request(domainObject) {
    if (!this.provider?.supportsRequest(domainObject)) {
      return Promise.reject('Provider does not support request operation');
    }

    return this.provider.request(domainObject);
  }

  /**
   * Subscribes to fault data updates for a given domain object.
   * This method checks if the current provider supports the subscribe operation for the given domain object.
   * If supported, it delegates the subscription to the provider's subscribe method.
   * If not supported, it returns a rejected promise.
   *
   * @param {import('openmct').DomainObject} domainObject - The domain object for which to subscribe to fault data updates.
   * @param {Function} callback - The callback function to be called with fault data updates.
   * @returns {Function} unsubscribe - A function to unsubscribe from the fault data updates.
   */
  subscribe(domainObject, callback) {
    if (!this.provider?.supportsSubscribe(domainObject)) {
      return Promise.reject('Provider does not support subscribe operation');
    }

    return this.provider.subscribe(domainObject, callback);
  }

  /**
   * Acknowledges a fault using the provider's acknowledgeFault method.
   *
   * @param {Fault} fault - The fault object to be acknowledged.
   * @param {*} ackData - Additional data required for acknowledging the fault.
   * @returns {Promise.<T>} - A promise that resolves when the fault is acknowledged.
   */
  acknowledgeFault(fault, ackData) {
    return this.provider.acknowledgeFault(fault, ackData);
  }

  /**
   * Shelves a fault using the provider's shelveFault method.
   *
   * @param {Fault} fault - The fault object to be shelved.
   * @param {*} shelveData - Additional data required for shelving the fault.
   * @returns {Promise.<T>} - A promise that resolves when the fault is shelved.
   */
  shelveFault(fault, shelveData) {
    return this.provider.shelveFault(fault, shelveData);
  }

  /**
   * Retrieves the available shelve durations from the provider, or the default durations if the
   * provider does not provide any.
   * @returns {ShelveDuration[] | undefined}
   */
  getShelveDurations() {
    if (!this.provider) {
      return;
    }

    return this.provider.getShelveDurations?.() ?? DEFAULT_SHELVE_DURATIONS;
  }
}

/**
 * @typedef {Object} ShelveDuration
 * @property {string} name - The name of the shelve duration
 * @property {number|null} value - The value of the shelve duration in milliseconds, or null for unlimited
 */

/**
 * @typedef {Object} TriggerValueInfo
 * @property {number} value
 * @property {string} rangeCondition
 * @property {string} monitoringResult
 */

/**
 * @typedef {Object} CurrentValueInfo
 * @property {number} value
 * @property {string} rangeCondition
 * @property {string} monitoringResult
 */

/**
 * @typedef {Object} Fault
 * @property {boolean} acknowledged
 * @property {CurrentValueInfo} currentValueInfo
 * @property {string} id
 * @property {string} name
 * @property {string} namespace
 * @property {number} seqNum
 * @property {string} severity
 * @property {boolean} shelved
 * @property {string} shortDescription
 * @property {string} triggerTime
 * @property {TriggerValueInfo} triggerValueInfo
 */

/**
 * @typedef {Object} FaultAPIResponse
 * @property {string} type
 * @property {Fault} fault
 */
