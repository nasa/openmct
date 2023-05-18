/* eslint-disable no-invalid-this */
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

import { createOpenMct, resetApplicationState } from 'utils/testing';

describe('The local storage plugin', () => {
  let space;
  let openmct;

  beforeEach(() => {
    space = `test-${Date.now()}`;
    openmct = createOpenMct();

    openmct.install(openmct.plugins.LocalStorage('', space));
  });

  it('initializes localstorage if not already initialized', () => {
    const ls = getLocalStorage();
    expect(ls[space]).toBeDefined();
  });

  it('successfully persists an object to localstorage', async () => {
    const domainObject = {
      identifier: {
        namespace: '',
        key: 'test-key'
      },
      name: 'A test object'
    };
    let spaceAsObject = getSpaceAsObject();
    expect(spaceAsObject['test-key']).not.toBeDefined();

    await openmct.objects.save(domainObject);

    spaceAsObject = getSpaceAsObject();
    expect(spaceAsObject['test-key']).toBeDefined();
  });

  it('successfully retrieves an object from localstorage', async () => {
    const domainObject = {
      identifier: {
        namespace: '',
        key: 'test-key'
      },
      name: 'A test object',
      anotherProperty: Date.now()
    };
    await openmct.objects.save(domainObject);

    let testObject = await openmct.objects.get(domainObject.identifier);

    expect(testObject.name).toEqual(domainObject.name);
    expect(testObject.anotherProperty).toEqual(domainObject.anotherProperty);
  });

  afterEach(() => {
    resetApplicationState(openmct);
    resetLocalStorage();
  });

  function resetLocalStorage() {
    delete window.localStorage[space];
  }

  function getLocalStorage() {
    return window.localStorage;
  }

  function getSpaceAsObject() {
    return JSON.parse(getLocalStorage()[space]);
  }
});
