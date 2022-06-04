/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * License); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import {
    createOpenMct,
    resetApplicationState
} from '../../utils/testing';

const faultName = 'super duper fault';
const aFault = {
    type: '',
    fault: {
        acknowledged: true,
        currentValueInfo: {
            value: 0,
            rangeCondition: '',
            monitoringResult: ''
        },
        id: '',
        name: faultName,
        namespace: '',
        seqNum: 0,
        severity: '',
        shelved: true,
        shortDescription: '',
        triggerTime: '',
        triggerValueInfo: {
            value: 0,
            rangeCondition: '',
            monitoringResult: ''
        }
    }
};
const faultDomainObject = {
    name: 'it is not your fault',
    type: 'faultManagement',
    identifier: {
        key: 'nobodies',
        namespace: 'fault'
    }
};
const faultManagementProvider = {
    request() {
        return Promise.resolve([aFault]);
    },
    subscribe() {},
    supportsRequest(domainObject) {
        return domainObject.type === 'faultManagement';
    },
    supportsSubscribe(domainObject) {
        return domainObject.type === 'faultManagement';
    },
    acknowledgeFault(fault, { comment = '' }) {
        return Promise.resolve({
            success: true
        });
    },
    shelveFault(fault, shelveData) {
        return Promise.resolve({
            success: true
        });
    }
};

describe('The Fault Management API', () => {
    let openmct;

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.install(openmct.plugins.FaultManagement());
        openmct.faults.addProvider(faultManagementProvider);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('allows you to request a fault', async () => {
        let faultResponse = await openmct.faults.request(faultDomainObject);
        expect(faultResponse[0].fault.name).toEqual(faultName);
    });

    it('will tell you if the fault management provider supports actions', () => {
        expect(openmct.faults.hasActions()).toBeTrue();
    });

});
