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
import { createOpenMct, resetApplicationState } from '../utils/testing.js';
import { identifierToString, objectPathToUrl, paramsToArray } from './url.js';

describe('the url tool', function () {
  let openmct;
  let mockObjectPath;

  beforeEach((done) => {
    mockObjectPath = [
      {
        name: 'mock folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        }
      },
      {
        name: 'mock parent folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-parent-folder',
          namespace: ''
        }
      }
    ];
    openmct = createOpenMct();
    openmct.on('start', () => {
      openmct.router.setPath('/browse/mine?testParam1=testValue1');
      done();
    });
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('paramsToArray', () => {
    it('exists', () => {
      expect(paramsToArray).toBeDefined();
    });
    it('can construct an array properly from query parameters', () => {
      const arrayOfParams = paramsToArray(openmct);
      expect(arrayOfParams.length).toBeDefined();
      expect(arrayOfParams.length).toBeGreaterThan(0);
    });
  });

  describe('identifierToString', () => {
    it('exists', () => {
      expect(identifierToString).toBeDefined();
    });
    it('can construct a String properly from a path', () => {
      const constructedString = identifierToString(openmct, mockObjectPath);
      expect(constructedString).toEqual('#/browse/mock-parent-folder/mock-folder');
    });
  });

  describe('objectPathToUrl', () => {
    it('exists', () => {
      expect(objectPathToUrl).toBeDefined();
    });
    it('can construct URL properly from a path', () => {
      const constructedURL = objectPathToUrl(openmct, mockObjectPath);
      expect(constructedURL).toContain('#/browse/mock-parent-folder/mock-folder');
    });
    it('can take params to set a custom url', () => {
      const customParams = {
        'tc.startBound': 1669911059,
        'tc.endBound': 1669911082,
        'tc.mode': 'fixed'
      };
      const constructedURL = objectPathToUrl(openmct, mockObjectPath, customParams);
      expect(constructedURL).toContain('tc.startBound=1669911059&tc.endBound=1669911082');
      expect(constructedURL).toContain('tc.mode=fixed');
    });
  });
});
