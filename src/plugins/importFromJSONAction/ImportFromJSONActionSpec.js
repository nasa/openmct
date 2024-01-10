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

import { createOpenMct, resetApplicationState } from 'utils/testing';

let openmct;
let importFromJSONAction;
let folderObject;
let unObserve;

describe('The import JSON action', function () {
  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    importFromJSONAction = openmct.actions.getAction('import.JSON');
    folderObject = {
      composition: [],
      name: 'Unnamed Folder',
      type: 'folder',
      location: '9f6c9dae-51c3-401d-92f1-c812de942922',
      modified: 1637021471624,
      persisted: 1637021471624,
      id: '84438cda-a071-48d1-b9bf-d77bd53e59ba',
      identifier: {
        namespace: '',
        key: '84438cda-a071-48d1-b9bf-d77bd53e59ba'
      }
    };
  });

  afterEach(() => {
    importFromJSONAction = undefined;
    folderObject = undefined;
    unObserve?.();
    unObserve = undefined;

    return resetApplicationState(openmct);
  });

  it('has import as JSON action', () => {
    expect(importFromJSONAction).toBeDefined();
  });

  it('applies to return true for objects with composition', function () {
    const objectPath = [folderObject];

    spyOn(openmct.composition, 'get').and.returnValue(true);

    expect(importFromJSONAction.appliesTo(objectPath)).toBe(true);
  });

  it('applies to return false for objects without composition', function () {
    const domainObject = {
      telemetry: {
        period: 10,
        amplitude: 1,
        offset: 0,
        dataRateInHz: 1,
        phase: 0,
        randomness: 0
      },
      name: 'Unnamed Sine Wave Generator',
      type: 'generator',
      location: '84438cda-a071-48d1-b9bf-d77bd53e59ba',
      modified: 1637021471172,
      identifier: {
        namespace: '',
        key: 'c102b6e1-3c81-4618-926a-56cc310925f6'
      },
      persisted: 1637021471172
    };

    const objectPath = [domainObject];

    spyOn(openmct.types, 'get').and.returnValue({});
    spyOn(openmct.composition, 'get').and.returnValue(false);

    expect(importFromJSONAction.appliesTo(objectPath)).toBe(false);
  });

  it('calls showForm on invoke ', function () {
    const objectPath = [folderObject];

    spyOn(openmct.forms, 'showForm').and.returnValue(Promise.resolve({}));
    spyOn(importFromJSONAction, 'onSave').and.returnValue(Promise.resolve({}));
    importFromJSONAction.invoke(objectPath);

    expect(openmct.forms.showForm).toHaveBeenCalled();
  });

  it('protects against prototype pollution', (done) => {
    spyOn(console, 'warn');
    spyOn(openmct.forms, 'showForm').and.callFake(returnResponseWithPrototypePollution);

    unObserve = openmct.objects.observe(folderObject, '*', callback);

    importFromJSONAction.invoke([folderObject]);

    function callback(newObject) {
      const hasPollutedProto =
        Object.prototype.hasOwnProperty.call(newObject, '__proto__') ||
        Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(newObject), 'toString');

      // warning from openmct.objects.get
      expect(console.warn).not.toHaveBeenCalled();
      expect(hasPollutedProto).toBeFalse();

      done();
    }

    function returnResponseWithPrototypePollution() {
      const pollutedResponse = {
        selectFile: {
          name: 'imported object',
          // eslint-disable-next-line prettier/prettier
          body: "{\"openmct\":{\"c28d230d-e909-4a3e-9840-d9ef469dda70\":{\"identifier\":{\"key\":\"c28d230d-e909-4a3e-9840-d9ef469dda70\",\"namespace\":\"\"},\"name\":\"Unnamed Overlay Plot\",\"type\":\"telemetry.plot.overlay\",\"composition\":[],\"configuration\":{\"series\":[]},\"modified\":1695837546833,\"location\":\"mine\",\"created\":1695837546833,\"persisted\":1695837546833,\"__proto__\":{\"toString\":\"foobar\"}}},\"rootId\":\"c28d230d-e909-4a3e-9840-d9ef469dda70\"}"
        }
      };

      return Promise.resolve(pollutedResponse);
    }
  });
});
