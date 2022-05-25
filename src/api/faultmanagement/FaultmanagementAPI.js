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

    acknowledgeFault(fault, ackData) {
        return this.faultActionProvider.acknowledgeFault(fault, ackData);
    }

    addProvider(provider) {
        this.provider = provider;
    }

    addFaultActionProvider(provider) {
        this.faultActionProvider = provider;
    }

    getFaultModel(faultData) {
        return {
            type: faultData.type,
            fault: {
                acknowledged: Boolean(faultData?.acknowledged),
                currentValueInfo: {
                    value: faultData?.parameterDetail?.currentValue?.engValue?.doubleValue,
                    rangeCondition: faultData?.parameterDetail?.currentValue?.rangeCondition,
                    monitoringResult: faultData?.parameterDetail?.currentValue?.monitoringResult
                },
                id: `id-${faultData.id.namespace}-${faultData.id.name}`,
                name: faultData?.id?.name,
                namespace: faultData?.id?.namespace,
                severity: faultData?.severity,
                shelved: Boolean(faultData?.shelveInfo),
                shortDescription: faultData?.parameterDetail?.parameter?.shortDescription,
                triggerTime: faultData?.triggerTime,
                triggerValueInfo: {
                    value: faultData?.parameterDetail?.triggerValue?.engValue?.doubleValue,
                    rangeCondition: faultData?.parameterDetail?.triggerValue?.rangeCondition,
                    monitoringResult: faultData?.parameterDetail?.triggerValue?.monitoringResult
                }
            }
        };
    }

    request(domainObject) {
        if (!this.provider?.supportsRequest(domainObject)) {
            return Promise.reject();
        }

        return this.provider.request(domainObject);
    }

    shelveFault(fault, shelveData) {
        return this.faultActionProvider.shelveFault(fault, shelveData);
    }

    subscribe(domainObject, callback) {
        if (!this.provider?.supportsSubscribe(domainObject)) {
            return Promise.reject();
        }

        return this.provider.subscribe(domainObject, callback);
    }
}
