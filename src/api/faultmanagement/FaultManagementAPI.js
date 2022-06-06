/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
    constructor(openmct) {
        this.openmct = openmct;
    }

    addProvider(provider) {
        this.provider = provider;
    }

    supportsActions() {
        return this.provider?.acknowledgeFault !== undefined && this.provider?.shelveFault !== undefined;
    }

    request(domainObject) {
        if (!this.provider?.supportsRequest(domainObject)) {
            return Promise.reject();
        }

        return this.provider.request(domainObject);
    }

    subscribe(domainObject, callback) {
        if (!this.provider?.supportsSubscribe(domainObject)) {
            return Promise.reject();
        }

        return this.provider.subscribe(domainObject, callback);
    }

    acknowledgeFault(fault, ackData) {
        return this.provider.acknowledgeFault(fault, ackData);
    }

    shelveFault(fault, shelveData) {
        return this.provider.shelveFault(fault, shelveData);
    }
}

/** @typedef {object} Fault
 * @property {string} type
 * @property {object} fault
 * @property {boolean} fault.acknowledged
 * @property {object} fault.currentValueInfo
 * @property {number} fault.currentValueInfo.value
 * @property {string} fault.currentValueInfo.rangeCondition
 * @property {string} fault.currentValueInfo.monitoringResult
 * @property {string} fault.id
 * @property {string} fault.name
 * @property {string} fault.namespace
 * @property {number} fault.seqNum
 * @property {string} fault.severity
 * @property {boolean} fault.shelved
 * @property {string} fault.shortDescription
 * @property {string} fault.triggerTime
 * @property {object} fault.triggerValueInfo
 * @property {number} fault.triggerValueInfo.value
 * @property {string} fault.triggerValueInfo.rangeCondition
 * @property {string} fault.triggerValueInfo.monitoringResult
 * @example
 *  {
 *     "type": "",
 *     "fault": {
 *         "acknowledged": true,
 *         "currentValueInfo": {
 *             "value": 0,
 *             "rangeCondition": "",
 *             "monitoringResult": ""
 *         },
 *         "id": "",
 *         "name": "",
 *         "namespace": "",
 *         "seqNum": 0,
 *         "severity": "",
 *         "shelved": true,
 *         "shortDescription": "",
 *         "triggerTime": "",
 *         "triggerValueInfo": {
 *             "value": 0,
 *             "rangeCondition": "",
 *             "monitoringResult": ""
 *         }
 *     }
 * }
 */
