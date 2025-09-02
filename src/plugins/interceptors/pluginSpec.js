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

import InterceptorPlugin from './plugin.js';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  const TEST_NAMESPACE = 'test';

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.install(new InterceptorPlugin(openmct));

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the missingObjectInterceptor', () => {
    let mockProvider;

    beforeEach(() => {
      mockProvider = jasmine.createSpyObj('mock provider', ['get']);
      mockProvider.get.and.returnValue(Promise.resolve(undefined));
      openmct.objects.addProvider(TEST_NAMESPACE, mockProvider);
    });

    it('returns missing objects', () => {
      const identifier = {
        namespace: TEST_NAMESPACE,
        key: 'hello'
      };

      return openmct.objects.get(identifier).then((testObject) => {
        expect(testObject).toEqual({
          identifier,
          type: 'unknown',
          name: 'Missing: test:hello'
        });
      });
    });
  });
});
