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
import { makeKeyString, parseKeyString } from 'objectUtils';

import Transaction from './Transaction.js';

let openmct = {};
let objectAPI;
let transaction;

describe('Transaction Class', () => {
  beforeEach(() => {
    objectAPI = {
      makeKeyString: (identifier) => makeKeyString(identifier),
      save: () => Promise.resolve(true),
      mutate: (object, prop, value) => {
        object[prop] = value;

        return object;
      },
      refresh: (object) => Promise.resolve(object),
      areIdsEqual: (...identifiers) => {
        return identifiers.map(parseKeyString).every((identifier) => {
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
