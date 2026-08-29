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

describe('Export as JSON plugin', () => {
  const ACTION_KEY = 'export.JSON';

  let openmct;
  let domainObject;
  let exportAsJSONAction;

  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    exportAsJSONAction = openmct.actions.getAction(ACTION_KEY);
  });

  afterEach(() => resetApplicationState(openmct));

  it('Export as JSON action exist', () => {
    expect(exportAsJSONAction.key).toEqual(ACTION_KEY);
  });

  it('ExportAsJSONAction applies to folder', () => {
    domainObject = {
      identifier: {
        key: 'export-testing',
        namespace: ''
      },
      composition: [],
      location: 'mine',
      modified: 1640115501237,
      name: 'Unnamed Folder',
      persisted: 1640115501237,
      type: 'folder'
    };

    expect(exportAsJSONAction.appliesTo([domainObject])).toEqual(true);
  });

  it('ExportAsJSONAction applies to telemetry.plot.overlay', () => {
    domainObject = {
      identifier: {
        key: 'export-testing',
        namespace: ''
      },
      composition: [],
      location: 'mine',
      modified: 1640115501237,
      name: 'Unnamed Plot',
      persisted: 1640115501237,
      type: 'telemetry.plot.overlay'
    };

    expect(exportAsJSONAction.appliesTo([domainObject])).toEqual(true);
  });

  it('ExportAsJSONAction applies to telemetry.plot.stacked', () => {
    domainObject = {
      identifier: {
        key: 'export-testing',
        namespace: ''
      },
      composition: [],
      location: 'mine',
      modified: 1640115501237,
      name: 'Unnamed Plot',
      persisted: 1640115501237,
      type: 'telemetry.plot.stacked'
    };

    expect(exportAsJSONAction.appliesTo([domainObject])).toEqual(true);
  });

  it('ExportAsJSONAction does not apply to non-persistable objects', () => {
    domainObject = {
      identifier: {
        key: 'export-testing',
        namespace: ''
      },
      composition: [],
      location: 'mine',
      modified: 1640115501237,
      name: 'Non Editable Folder',
      persisted: 1640115501237,
      type: 'folder'
    };

    spyOn(openmct.objects, 'getProvider').and.callFake(() => {
      return { get: () => domainObject };
    });

    expect(exportAsJSONAction.appliesTo([domainObject])).toEqual(false);
  });

  it('ExportAsJSONAction exports object from tree', (done) => {
    const parent = {
      composition: [
        {
          key: 'child',
          namespace: ''
        }
      ],
      identifier: {
        key: 'parent',
        namespace: ''
      },
      name: 'Parent',
      type: 'folder',
      modified: 1503598129176,
      location: 'mine',
      persisted: 1503598129176
    };

    const child = {
      composition: [],
      identifier: {
        key: 'child',
        namespace: ''
      },
      name: 'Child',
      type: 'folder',
      modified: 1503598132428,
      location: 'parent',
      persisted: 1503598132428
    };

    spyOn(openmct.composition, 'get').and.callFake((object) => {
      return {
        load: () => {
          if (object.name === 'Parent') {
            return Promise.resolve([child]);
          }

          return Promise.resolve([]);
        }
      };
    });

    spyOn(exportAsJSONAction, 'saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'parent')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'child')).toBeTruthy();

      done();
    });

    exportAsJSONAction.invoke([parent]);
  });

  it('ExportAsJSONAction skips non-creatable objects from tree', (done) => {
    const parent = {
      composition: [
        {
          key: 'child',
          namespace: ''
        }
      ],
      identifier: {
        key: 'parent',
        namespace: ''
      },
      name: 'Parent of Non Editable Child Folder',
      type: 'folder',
      modified: 1503598129176,
      location: 'mine',
      persisted: 1503598129176
    };

    const child = {
      composition: [],
      identifier: {
        key: 'child',
        namespace: ''
      },
      name: 'Non Editable Child Folder',
      type: 'noneditable.folder',
      modified: 1503598132428,
      location: 'parent',
      persisted: 1503598132428
    };

    spyOn(openmct.composition, 'get').and.callFake((object) => {
      return {
        load: () => {
          if (object.identifier.key === 'parent') {
            return Promise.resolve([child]);
          }

          return Promise.resolve([]);
        }
      };
    });

    spyOn(exportAsJSONAction, 'saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'parent')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'child')).not.toBeTruthy();

      done();
    });

    exportAsJSONAction.invoke([parent]);
  });

  it('can export self-containing objects', (done) => {
    const parent = {
      composition: [
        {
          key: 'infiniteChild',
          namespace: ''
        }
      ],
      identifier: {
        key: 'infiniteParent',
        namespace: ''
      },
      name: 'parent',
      type: 'folder',
      modified: 1503598129176,
      location: 'mine',
      persisted: 1503598129176
    };

    const child = {
      composition: [
        {
          key: 'infiniteParent',
          namespace: ''
        }
      ],
      identifier: {
        key: 'infiniteChild',
        namespace: ''
      },
      name: 'child',
      type: 'folder',
      modified: 1503598132428,
      location: 'infiniteParent',
      persisted: 1503598132428
    };

    spyOn(openmct.composition, 'get').and.callFake((object) => {
      return {
        load: () => {
          if (object.name === 'parent') {
            return Promise.resolve([child]);
          }

          return Promise.resolve([]);
        }
      };
    });

    spyOn(exportAsJSONAction, 'saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(
        Object.prototype.hasOwnProperty.call(completedTree.openmct, 'infiniteParent')
      ).toBeTruthy();
      expect(
        Object.prototype.hasOwnProperty.call(completedTree.openmct, 'infiniteChild')
      ).toBeTruthy();

      done();
    });

    exportAsJSONAction.invoke([parent]);
  });

  it('exports links to external objects as new objects', function (done) {
    const parent = {
      composition: [
        {
          key: 'child',
          namespace: ''
        }
      ],
      identifier: {
        key: 'parent',
        namespace: ''
      },
      name: 'Parent',
      type: 'folder',
      modified: 1503598129176,
      location: 'mine',
      persisted: 1503598129176
    };

    const child = {
      composition: [],
      identifier: {
        key: 'child',
        namespace: ''
      },
      name: 'Child',
      type: 'folder',
      modified: 1503598132428,
      location: 'outsideOfTree',
      persisted: 1503598132428
    };

    spyOn(openmct.composition, 'get').and.callFake((object) => {
      return {
        load: () => {
          if (object.name === 'Parent') {
            return Promise.resolve([child]);
          }

          return Promise.resolve([]);
        }
      };
    });

    spyOn(exportAsJSONAction, 'saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'parent')).toBeTruthy();

      // parent and child objects as part of openmct but child with new id/key
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'child')).not.toBeTruthy();
      expect(Object.keys(completedTree.openmct).length).toBe(2);

      done();
    });

    exportAsJSONAction.invoke([parent]);
  });

  it('ExportAsJSONAction exports object references from tree', (done) => {
    const parent = {
      composition: [],
      configuration: {
        objectStyles: {
          conditionSetIdentifier: {
            key: 'child',
            namespace: ''
          }
        }
      },
      identifier: {
        key: 'parent',
        namespace: ''
      },
      name: 'Parent',
      type: 'folder',
      modified: 1503598129176,
      location: 'mine',
      persisted: 1503598129176
    };

    const child = {
      composition: [],
      identifier: {
        key: 'child',
        namespace: ''
      },
      name: 'Child',
      type: 'folder',
      modified: 1503598132428,
      location: null,
      persisted: 1503598132428
    };

    spyOn(openmct.objects, 'get').and.callFake((object) => {
      return Promise.resolve(child);
    });

    spyOn(exportAsJSONAction, 'saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      const conditionSetId = Object.keys(completedTree.openmct)[1];
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree.openmct, 'parent')).toBeTruthy();
      expect(completedTree.openmct[conditionSetId].name).toBe('Child');

      done();
    });

    exportAsJSONAction.invoke([parent]);
  });
});
