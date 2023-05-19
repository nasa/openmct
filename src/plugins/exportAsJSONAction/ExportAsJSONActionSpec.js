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

  it('ExportAsJSONAction does not applie to non-persistable objects', () => {
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

    spyOn(exportAsJSONAction, '_saveAs').and.callFake((completedTree) => {
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

    spyOn(exportAsJSONAction, '_saveAs').and.callFake((completedTree) => {
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
          key: 'infinteChild',
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
        key: 'infinteChild',
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

    spyOn(exportAsJSONAction, '_saveAs').and.callFake((completedTree) => {
      expect(Object.keys(completedTree).length).toBe(2);
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'openmct')).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(completedTree, 'rootId')).toBeTruthy();
      expect(
        Object.prototype.hasOwnProperty.call(completedTree.openmct, 'infiniteParent')
      ).toBeTruthy();
      expect(
        Object.prototype.hasOwnProperty.call(completedTree.openmct, 'infinteChild')
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

    spyOn(exportAsJSONAction, '_saveAs').and.callFake((completedTree) => {
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

    spyOn(exportAsJSONAction, '_saveAs').and.callFake((completedTree) => {
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
