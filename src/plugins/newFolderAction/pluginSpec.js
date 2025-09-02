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

describe('the plugin', () => {
  let openmct;
  let newFolderAction;

  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    newFolderAction = openmct.actions._allActions.newFolder;
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('installs the new folder action', () => {
    expect(newFolderAction).toBeDefined();
  });

  describe('when invoked', () => {
    let parentObject;
    let parentObjectPath;
    let changedParentObject;
    let unobserve;
    beforeEach((done) => {
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

      unobserve = openmct.objects.observe(parentObject, '*', (newObject) => {
        changedParentObject = newObject;

        done();
      });

      newFolderAction.invoke(parentObjectPath);
    });
    afterEach(() => {
      unobserve();
    });

    it('creates a new folder object', () => {
      expect(openmct.objects.save).toHaveBeenCalled();
    });

    it('adds new folder object to parent composition', () => {
      const composition = changedParentObject.composition;

      expect(composition.length).toBe(1);
    });

    it('checks if the domainObject is persistable', () => {
      const mockObjectPath = [
        {
          name: 'mock folder',
          type: 'folder',
          identifier: {
            key: 'mock-folder',
            namespace: ''
          }
        }
      ];

      spyOn(openmct.objects, 'isPersistable').and.returnValue(true);

      newFolderAction.appliesTo(mockObjectPath);

      expect(openmct.objects.isPersistable).toHaveBeenCalled();
    });
  });
});
