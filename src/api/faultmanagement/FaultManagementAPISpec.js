/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import { createOpenMct, resetApplicationState } from '../../utils/testing';

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
const aComment = 'THIS is my fault.';
const faultManagementProvider = {
  request() {
    return Promise.resolve([aFault]);
  },
  subscribe(domainObject, callback) {
    return () => {};
  },
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
    // openmct.install(openmct.plugins.example.ExampleFaultSource());
    openmct.faults.addProvider(faultManagementProvider);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('allows you to request a fault', async () => {
    spyOn(faultManagementProvider, 'supportsRequest').and.callThrough();

    let faultResponse = await openmct.faults.request(faultDomainObject);

    expect(faultManagementProvider.supportsRequest).toHaveBeenCalledWith(faultDomainObject);
    expect(faultResponse[0].fault.name).toEqual(faultName);
  });

  it('allows you to subscribe to a fault', () => {
    spyOn(faultManagementProvider, 'subscribe').and.callThrough();
    spyOn(faultManagementProvider, 'supportsSubscribe').and.callThrough();

    let unsubscribe = openmct.faults.subscribe(faultDomainObject, () => {});

    expect(unsubscribe).toEqual(jasmine.any(Function));
    expect(faultManagementProvider.supportsSubscribe).toHaveBeenCalledWith(faultDomainObject);
    expect(faultManagementProvider.subscribe).toHaveBeenCalledOnceWith(
      faultDomainObject,
      jasmine.any(Function)
    );
  });

  it('will tell you if the fault management provider supports actions', () => {
    expect(openmct.faults.supportsActions()).toBeTrue();
  });

  it('will allow you to acknowledge a fault', async () => {
    spyOn(faultManagementProvider, 'acknowledgeFault').and.callThrough();

    let ackResponse = await openmct.faults.acknowledgeFault(aFault, aComment);

    expect(faultManagementProvider.acknowledgeFault).toHaveBeenCalledWith(aFault, aComment);
    expect(ackResponse.success).toBeTrue();
  });

  it('will allow you to shelve a fault', async () => {
    spyOn(faultManagementProvider, 'shelveFault').and.callThrough();

    let shelveResponse = await openmct.faults.shelveFault(aFault, aComment);

    expect(faultManagementProvider.shelveFault).toHaveBeenCalledWith(aFault, aComment);
    expect(shelveResponse.success).toBeTrue();
  });
});
