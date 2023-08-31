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
import CreateAction from './CreateAction';

import { createOpenMct, resetApplicationState } from 'utils/testing';

import { debounce } from 'lodash';

let parentObject;
let parentObjectPath;
let unObserve;

describe('The create action plugin', () => {
  let openmct;

  const TYPES = [
    'clock',
    'conditionWidget',
    'conditionWidget',
    'example.imagery',
    'example.state-generator',
    'flexible-layout',
    'folder',
    'generator',
    'hyperlink',
    'LadTable',
    'LadTableSet',
    'layout',
    'mmgis',
    'notebook',
    'plan',
    'table',
    'tabs',
    'telemetry-mean',
    'telemetry.plot.bar-graph',
    'telemetry.plot.overlay',
    'telemetry.plot.stacked',
    'time-strip',
    'timer',
    'webpage'
  ];

  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('creates new objects for a', () => {
    beforeEach(() => {
      parentObject = {
        name: 'mock folder',
        type: 'folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        },
        composition: []
      };
      parentObjectPath = [parentObject];

      spyOn(openmct.objects, 'save');
      openmct.objects.save.and.callThrough();
      spyOn(openmct.forms, 'showForm');
      openmct.forms.showForm.and.callFake((formStructure) => {
        return Promise.resolve({
          name: 'test',
          notes: 'test notes',
          location: parentObjectPath
        });
      });
    });

    afterEach(() => {
      parentObject = null;
      unObserve();
    });

    TYPES.forEach((type) => {
      it(`type ${type}`, (done) => {
        function callback(newObject) {
          const composition = newObject.composition;

          openmct.objects.get(composition[0]).then((object) => {
            expect(object.type).toEqual(type);
            expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

            done();
          });
        }

        const deBouncedCallback = debounce(callback, 300);
        unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

        const createAction = new CreateAction(openmct, type, parentObject);
        createAction.invoke();
      });
    });
  });
});
