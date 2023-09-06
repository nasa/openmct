import utils from 'objectUtils';

import Transaction from './Transaction';

let openmct = {};
let objectAPI;
let transaction;

describe('Transaction Class', () => {
  beforeEach(() => {
    objectAPI = {
      makeKeyString: (identifier) => utils.makeKeyString(identifier),
      save: () => Promise.resolve(true),
      mutate: (object, prop, value) => {
        object[prop] = value;

        return object;
      },
      refresh: (object) => Promise.resolve(object),
      areIdsEqual: (...identifiers) => {
        return identifiers.map(utils.parseKeyString).every((identifier) => {
          return (
            identifier === identifiers[0] ||
            (identifier.namespace === identifiers[0].namespace &&
              identifier.key === identifiers[0].key)
          );
        });
      }
    };

    transaction = new Transaction(objectAPI);

    openmct.editor = {
      isEditing: () => true
    };
  });

  it('has no dirty objects', () => {
    expect(Object.keys(transaction.dirtyObjects).length).toEqual(0);
  });

  it('add(), adds object to dirtyObjects', () => {
    const mockDomainObjects = createMockDomainObjects();
    transaction.add(mockDomainObjects[0]);
    expect(Object.keys(transaction.dirtyObjects).length).toEqual(1);
  });

  it('cancel(), clears all dirtyObjects', (done) => {
    const mockDomainObjects = createMockDomainObjects(3);
    mockDomainObjects.forEach(transaction.add.bind(transaction));

    expect(Object.keys(transaction.dirtyObjects).length).toEqual(3);

    transaction
      .cancel()
      .then((success) => {
        expect(Object.keys(transaction.dirtyObjects).length).toEqual(0);
      })
      .finally(done);
  });

  it('commit(), saves all dirtyObjects', (done) => {
    const mockDomainObjects = createMockDomainObjects(3);
    mockDomainObjects.forEach(transaction.add.bind(transaction));

    expect(Object.keys(transaction.dirtyObjects).length).toEqual(3);
    spyOn(objectAPI, 'save').and.callThrough();

    transaction
      .commit()
      .then((success) => {
        expect(Object.keys(transaction.dirtyObjects).length).toEqual(0);
        expect(objectAPI.save.calls.count()).toEqual(3);
      })
      .finally(done);
  });

  it('getDirtyObject(), returns correct dirtyObject', () => {
    const mockDomainObjects = createMockDomainObjects();
    transaction.add(mockDomainObjects[0]);

    expect(Object.keys(transaction.dirtyObjects).length).toEqual(1);
    const dirtyObject = transaction.getDirtyObject(mockDomainObjects[0].identifier);

    expect(dirtyObject).toEqual(mockDomainObjects[0]);
  });

  it('getDirtyObject(), returns empty dirtyObject for no active transaction', () => {
    const mockDomainObjects = createMockDomainObjects();

    expect(Object.keys(transaction.dirtyObjects).length).toEqual(0);
    const dirtyObject = transaction.getDirtyObject(mockDomainObjects[0].identifier);

    expect(dirtyObject).toEqual(undefined);
  });
});

function createMockDomainObjects(size = 1) {
  const objects = [];

  while (size > 0) {
    const mockDomainObject = {
      identifier: {
        namespace: 'test-namespace',
        key: `test-key-${size}`
      },
      name: `test object ${size}`,
      type: 'test-type'
    };

    objects.push(mockDomainObject);

    size--;
  }

  return objects;
}
