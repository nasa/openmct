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
import FolderPlugin from './plugin.js';
import Vue from 'vue';
import { createOpenMct, resetApplicationState } from 'utils/testing';

describe('The folder plugin', () => {
  let openmct;
  let folderPlugin;

  beforeEach((done) => {
    openmct = createOpenMct();
    folderPlugin = new FolderPlugin();
    openmct.install(folderPlugin);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the folder object type', () => {
    let folderType;

    beforeEach(() => {
      folderType = openmct.types.get('folder');
    });

    it('is installed by the plugin', () => {
      expect(folderType).toBeDefined();
    });

    it('is user creatable', () => {
      expect(folderType.definition.creatable).toBe(true);
    });
  });

  describe('the folder grid view', () => {
    let gridViewProvider;
    let listViewProvider;
    let folderObject;
    let addCallback;
    let parentDiv;
    let childDiv;

    beforeEach(() => {
      parentDiv = document.createElement('div');
      childDiv = document.createElement('div');
      parentDiv.appendChild(childDiv);

      folderObject = {
        identifier: {
          namespace: 'test-namespace',
          key: 'folder-object'
        },
        name: 'A folder!',
        type: 'folder',
        composition: [
          {
            namespace: 'test-namespace',
            key: 'child-object-1'
          },
          {
            namespace: 'test-namespace',
            key: 'child-object-2'
          },
          {
            namespace: 'test-namespace',
            key: 'child-object-3'
          },
          {
            namespace: 'test-namespace',
            key: 'child-object-4'
          }
        ]
      };

      gridViewProvider = openmct.objectViews
        .get(folderObject, [folderObject])
        .find((view) => view.key === 'grid');
      listViewProvider = openmct.objectViews
        .get(folderObject, [folderObject])
        .find((view) => view.key === 'list-view');

      const fakeCompositionCollection = jasmine.createSpyObj('compositionCollection', [
        'on',
        'load'
      ]);
      fakeCompositionCollection.on.and.callFake((eventName, callback) => {
        if (eventName === 'add') {
          addCallback = callback;
        }
      });
      fakeCompositionCollection.load.and.callFake(() => {
        folderObject.composition.forEach((identifier) => {
          addCallback({
            identifier,
            type: 'folder'
          });
        });
      });
      spyOn(openmct.composition, 'get').and.returnValue(fakeCompositionCollection);
    });

    describe('the grid view', () => {
      it('is installed by the plugin and is applicable to the folder type', () => {
        expect(gridViewProvider).toBeDefined();
      });
      it("renders each item contained in the folder's composition", async () => {
        let folderView = gridViewProvider.view(folderObject, [folderObject]);
        folderView.show(childDiv, true);

        await Vue.nextTick();

        let children = parentDiv.getElementsByClassName('js-folder-child');
        expect(children.length).toBe(folderObject.composition.length);
      });
    });

    describe('the list view', () => {
      it('installs a list view for the folder type', () => {
        expect(listViewProvider).toBeDefined();
      });
      it("renders each item contained in the folder's composition", async () => {
        let folderView = listViewProvider.view(folderObject, [folderObject]);
        folderView.show(childDiv, true);

        await Vue.nextTick();

        let children = parentDiv.getElementsByClassName('js-folder-child');
        expect(children.length).toBe(folderObject.composition.length);
      });
    });
  });
});
