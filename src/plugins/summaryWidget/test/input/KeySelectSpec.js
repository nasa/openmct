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
import KeySelect from '../../src/input/KeySelect.js';

describe('A select for choosing composition object properties', function () {
  let mockConfig;
  let mockBadConfig;
  let mockManager;
  let keySelect;
  let mockMetadata;
  let mockObjectSelect;
  beforeEach(function () {
    mockConfig = {
      object: 'object1',
      key: 'a'
    };

    mockBadConfig = {
      object: 'object1',
      key: 'someNonexistentKey'
    };

    mockMetadata = {
      object1: {
        a: {
          name: 'A'
        },
        b: {
          name: 'B'
        }
      },
      object2: {
        alpha: {
          name: 'Alpha'
        },
        beta: {
          name: 'Beta'
        }
      },
      object3: {
        a: {
          name: 'A'
        }
      }
    };

    mockManager = jasmine.createSpyObj('mockManager', [
      'on',
      'metadataLoadCompleted',
      'triggerCallback',
      'getTelemetryMetadata'
    ]);

    mockObjectSelect = jasmine.createSpyObj('mockObjectSelect', ['on', 'triggerCallback']);

    mockObjectSelect.on.and.callFake((event, callback) => {
      mockObjectSelect.callbacks = mockObjectSelect.callbacks || {};
      mockObjectSelect.callbacks[event] = callback;
    });

    mockObjectSelect.triggerCallback.and.callFake((event, key) => {
      mockObjectSelect.callbacks[event](key);
    });

    mockManager.on.and.callFake((event, callback) => {
      mockManager.callbacks = mockManager.callbacks || {};
      mockManager.callbacks[event] = callback;
    });

    mockManager.triggerCallback.and.callFake((event) => {
      mockManager.callbacks[event]();
    });

    mockManager.getTelemetryMetadata.and.callFake(function (key) {
      return mockMetadata[key];
    });
  });

  it('waits until the metadata fully loads to populate itself', function () {
    mockManager.metadataLoadCompleted.and.returnValue(false);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    expect(keySelect.getSelected()).toEqual('');
  });

  it('populates itself with metadata on a metadata load', function () {
    mockManager.metadataLoadCompleted.and.returnValue(false);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    mockManager.triggerCallback('metadata');
    expect(keySelect.getSelected()).toEqual('a');
  });

  it('populates itself with metadata if metadata load is already complete', function () {
    mockManager.metadataLoadCompleted.and.returnValue(true);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    expect(keySelect.getSelected()).toEqual('a');
  });

  it('clears its selection state if the property in its config is not in its object', function () {
    mockManager.metadataLoadCompleted.and.returnValue(true);
    keySelect = new KeySelect(mockBadConfig, mockObjectSelect, mockManager);
    expect(keySelect.getSelected()).toEqual('');
  });

  it('populates with the appropriate options when its linked object changes', function () {
    mockManager.metadataLoadCompleted.and.returnValue(true);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    mockObjectSelect.triggerCallback('change', 'object2');
    keySelect.setSelected('alpha');
    expect(keySelect.getSelected()).toEqual('alpha');
  });

  it('clears its selected state on change if the field is not present in the new object', function () {
    mockManager.metadataLoadCompleted.and.returnValue(true);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    mockObjectSelect.triggerCallback('change', 'object2');
    expect(keySelect.getSelected()).toEqual('');
  });

  it('maintains its selected state on change if field is present in new object', function () {
    mockManager.metadataLoadCompleted.and.returnValue(true);
    keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
    mockObjectSelect.triggerCallback('change', 'object3');
    expect(keySelect.getSelected()).toEqual('a');
  });
});
