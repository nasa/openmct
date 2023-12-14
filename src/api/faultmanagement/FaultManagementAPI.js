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

export default class FaultManagementAPI {
  /**
   * @param {import("openmct").OpenMCT} openmct
   */
  constructor(openmct) {
    this.openmct = openmct;
  }

  /**
   * @param {*} provider
   */
  addProvider(provider) {
    this.provider = provider;
  }

  /**
   * @returns {boolean}
   */
  supportsActions() {
    return (
      this.provider?.acknowledgeFault !== undefined && this.provider?.shelveFault !== undefined
    );
  }

  /**
   * @param {import("../objects/ObjectAPI").DomainObject} domainObject
   * @returns {Promise.<FaultAPIResponse[]>}
   */
  request(domainObject) {
    if (!this.provider?.supportsRequest(domainObject)) {
      return Promise.reject();
    }

    return this.provider.request(domainObject);
  }

  /**
   * @param {import("../objects/ObjectAPI").DomainObject} domainObject
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe(domainObject, callback) {
    if (!this.provider?.supportsSubscribe(domainObject)) {
      return Promise.reject();
    }

    return this.provider.subscribe(domainObject, callback);
  }

  /**
   * @param {Fault} fault
   * @param {*} ackData
   */
  acknowledgeFault(fault, ackData) {
    return this.provider.acknowledgeFault(fault, ackData);
  }

  /**
   * @param {Fault} fault
   * @param {*} shelveData
   * @returns {Promise.<T>}
   */
  shelveFault(fault, shelveData) {
    return this.provider.shelveFault(fault, shelveData);
  }
}

/**
 * @typedef {object} TriggerValueInfo
 * @property {number} value
 * @property {string} rangeCondition
 * @property {string} monitoringResult
 */

/**
 * @typedef {object} CurrentValueInfo
 * @property {number} value
 * @property {string} rangeCondition
 * @property {string} monitoringResult
 */

/**
 * @typedef {object} Fault
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
 * @typedef {object} FaultAPIResponse
 * @property {string} type
 * @property {Fault} fault
 */
