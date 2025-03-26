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
import { createOpenMct, getMockObjects, resetApplicationState } from 'utils/testing';

import { LINK_ACTION_KEY } from './LinkAction.js';
import LinkActionPlugin from './plugin.js';

describe('The Link Action plugin', () => {
  let openmct;
  let linkAction;
  let childObject;
  let parentObject;
  let anotherParentObject;
  const ORIGINAL_PARENT_ID = 'original-parent-object';
  const LINK_ACTION_NAME = 'Create Link';

  beforeEach((done) => {
    const appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';

    openmct = createOpenMct();

    childObject = getMockObjects({
      objectKeyStrings: ['folder'],
      overwrite: {
        folder: {
          name: 'Child Folder',
          location: ORIGINAL_PARENT_ID,
          identifier: {
            namespace: '',
            key: 'child-folder-object'
          }
        }
      }
    }).folder;

    parentObject = getMockObjects({
      objectKeyStrings: ['folder'],
      overwrite: {
        folder: {
          name: 'Parent Folder',
          identifier: {
            namespace: '',
            key: 'original-parent-object'
          },
          composition: [childObject.identifier]
        }
      }
    }).folder;

    anotherParentObject = getMockObjects({
      objectKeyStrings: ['folder'],
      overwrite: {
        folder: {
          name: 'Another Parent Folder'
        }
      }
    }).folder;

    openmct.router.path = [childObject]; // preview action uses this in it's applyTo method

    openmct.install(LinkActionPlugin());

    openmct.on('start', done);
    openmct.startHeadless(appHolder);
  });

  afterEach(() => {
    resetApplicationState(openmct);
  });

  it('should be defined', () => {
    expect(LinkActionPlugin).toBeDefined();
  });

  it('should make the link action available for an appropriate domainObject', () => {
    const actionCollection = openmct.actions.getActionsCollection([childObject]);
    const visibleActions = actionCollection.getVisibleActions();
    linkAction = visibleActions.find((a) => a.key === LINK_ACTION_KEY);

    expect(linkAction.name).toEqual(LINK_ACTION_NAME);
  });

  describe('when linking an object in a new parent', () => {
    beforeEach(() => {
      linkAction = openmct.actions.getAction(LINK_ACTION_KEY);
      linkAction.linkInNewParent(childObject, anotherParentObject);
    });

    it("the child object's identifier should be in the new parent's composition and location set to original parent", () => {
      let newParentChild = anotherParentObject.composition[0];
      expect(newParentChild).toEqual(childObject.identifier);
      expect(childObject.location).toEqual(ORIGINAL_PARENT_ID);
    });

    it("the child object's identifier should remain in the original parent's composition", () => {
      let oldParentCompositionChild = parentObject.composition[0];
      expect(oldParentCompositionChild).toEqual(childObject.identifier);
    });
  });
});
