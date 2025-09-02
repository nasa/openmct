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

import ObjectSelect from '../../src/input/ObjectSelect.js';

describe('A select for choosing composition objects', function () {
  let mockConfig;
  let mockBadConfig;
  let mockManager;
  let objectSelect;
  let mockComposition;
  beforeEach(function () {
    mockConfig = {
      object: 'key1'
    };

    mockBadConfig = {
      object: 'someNonexistentObject'
    };

    mockComposition = {
      key1: {
        identifier: {
          key: 'key1'
        },
        name: 'Object 1'
      },
      key2: {
        identifier: {
          key: 'key2'
        },
        name: 'Object 2'
      }
    };
    mockManager = jasmine.createSpyObj('mockManager', [
      'on',
      'loadCompleted',
      'triggerCallback',
      'getComposition'
    ]);

    mockManager.on.and.callFake((event, callback) => {
      mockManager.callbacks = mockManager.callbacks || {};
      mockManager.callbacks[event] = callback;
    });

    mockManager.triggerCallback.and.callFake((event, newObj) => {
      if (event === 'add') {
        mockManager.callbacks.add(newObj);
      } else {
        mockManager.callbacks[event]();
      }
    });

    mockManager.getComposition.and.callFake(function () {
      return mockComposition;
    });
  });

  it('allows setting special keyword options', function () {
    mockManager.loadCompleted.and.returnValue(true);
    objectSelect = new ObjectSelect(mockConfig, mockManager, [
      ['keyword1', 'A special option'],
      ['keyword2', 'A special option']
    ]);
    objectSelect.setSelected('keyword1');
    expect(objectSelect.getSelected()).toEqual('keyword1');
  });

  it('waits until the composition fully loads to populate itself', function () {
    mockManager.loadCompleted.and.returnValue(false);
    objectSelect = new ObjectSelect(mockConfig, mockManager);
    expect(objectSelect.getSelected()).toEqual('');
  });

  it('populates itself with composition objects on a composition load', function () {
    mockManager.loadCompleted.and.returnValue(false);
    objectSelect = new ObjectSelect(mockConfig, mockManager);
    mockManager.triggerCallback('load');
    expect(objectSelect.getSelected()).toEqual('key1');
  });

  it('populates itself with composition objects if load is already complete', function () {
    mockManager.loadCompleted.and.returnValue(true);
    objectSelect = new ObjectSelect(mockConfig, mockManager);
    expect(objectSelect.getSelected()).toEqual('key1');
  });

  it('clears its selection state if the object in its config is not in the composition', function () {
    mockManager.loadCompleted.and.returnValue(true);
    objectSelect = new ObjectSelect(mockBadConfig, mockManager);
    expect(objectSelect.getSelected()).toEqual('');
  });

  it('adds a new option on a composition add', function () {
    mockManager.loadCompleted.and.returnValue(true);
    objectSelect = new ObjectSelect(mockConfig, mockManager);
    mockManager.triggerCallback('add', {
      identifier: {
        key: 'key3'
      },
      name: 'Object 3'
    });
    objectSelect.setSelected('key3');
    expect(objectSelect.getSelected()).toEqual('key3');
  });

  it('removes an option on a composition remove', function () {
    mockManager.loadCompleted.and.returnValue(true);
    objectSelect = new ObjectSelect(mockConfig, mockManager);
    delete mockComposition.key1;
    mockManager.triggerCallback('remove');
    expect(objectSelect.getSelected()).not.toEqual('key1');
  });
});
