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

describe('the goToOriginalAction plugin', () => {
  let openmct;
  let goToOriginalAction;
  let mockRootFolder;
  let mockSubFolder;
  let mockSubSubFolder;
  let mockObject;
  let mockObjectPath;
  let hash;

  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    goToOriginalAction = openmct.actions._allActions.goToOriginal;
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('installs the go to folder action', () => {
    expect(goToOriginalAction).toBeDefined();
  });

  describe('when invoked', () => {
    beforeEach(() => {
      mockRootFolder = getMockObject('mock-root');
      mockSubFolder = getMockObject('mock-sub');
      mockSubSubFolder = getMockObject('mock-sub-sub');
      mockObject = getMockObject('mock-table');

      mockObjectPath = [mockObject, mockSubSubFolder, mockSubFolder, mockRootFolder];

      spyOn(openmct.objects, 'get').and.callFake((identifier) => {
        const mockedObject = getMockObject(identifier);

        return Promise.resolve(mockedObject);
      });

      spyOn(openmct.router, 'navigate').and.callFake((navigateTo) => {
        hash = navigateTo;
      });

      return goToOriginalAction.invoke(mockObjectPath);
    });

    it('goes to the original location', () => {
      const originalLocationHash = '#/browse/mock-root/mock-table';

      return waitForNavigation(() => {
        return hash === originalLocationHash;
      }).then(() => {
        expect(hash).toEqual(originalLocationHash);
      });
    });
  });

  function waitForNavigation(navigated) {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      checkNavigated();

      function checkNavigated() {
        const elapsed = Date.now() - start;

        if (navigated()) {
          resolve();
        } else if (elapsed >= jasmine.DEFAULT_TIMEOUT_INTERVAL - 1000) {
          reject("didn't navigate in time");
        } else {
          setTimeout(checkNavigated);
        }
      }
    });
  }

  function getMockObject(key) {
    const id = typeof key === 'string' ? key : key.key;

    const mockMCTObjects = {
      ROOT: {
        composition: [
          {
            namespace: '',
            key: 'mock-root'
          }
        ],
        identifier: {
          namespace: '',
          key: 'mock-root'
        }
      },
      'mock-root': {
        composition: [
          {
            namespace: '',
            key: 'mock-sub'
          },
          {
            namespace: '',
            key: 'mock-table'
          }
        ],
        name: 'root',
        type: 'folder',
        id: 'mock-root',
        location: 'ROOT',
        identifier: {
          namespace: '',
          key: 'mock-root'
        }
      },
      'mock-sub': {
        composition: [
          {
            namespace: '',
            key: 'mock-sub-sub'
          },
          {
            namespace: '',
            key: 'mock-table'
          }
        ],
        name: 'sub',
        type: 'folder',
        location: 'mock-root',
        identifier: {
          namespace: '',
          key: 'mock-sub'
        }
      },
      'mock-table': {
        composition: [],
        configuration: {
          columnWidths: {},
          hiddenColumns: {}
        },
        name: 'table',
        type: 'table',
        location: 'mock-root',
        identifier: {
          namespace: '',
          key: 'mock-table'
        }
      },
      'mock-sub-sub': {
        composition: [
          {
            namespace: '',
            key: 'mock-table'
          }
        ],
        name: 'sub sub',
        type: 'folder',
        location: 'mock-sub',
        identifier: {
          namespace: '',
          key: 'mock-sub-sub'
        }
      }
    };

    return mockMCTObjects[id];
  }
});
