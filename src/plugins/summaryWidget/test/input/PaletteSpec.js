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
import Palette from '../../src/input/Palette.js';

describe('A generic Open MCT palette input', function () {
  let palette;
  let callbackSpy1;
  let callbackSpy2;

  beforeEach(function () {
    palette = new Palette('someClass', 'someContainer', ['item1', 'item2', 'item3']);
    callbackSpy1 = jasmine.createSpy('changeCallback1');
    callbackSpy2 = jasmine.createSpy('changeCallback2');
  });

  it('gets the current item', function () {
    expect(palette.getCurrent()).toEqual('item1');
  });

  it('allows setting the current item', function () {
    palette.set('item2');
    expect(palette.getCurrent()).toEqual('item2');
  });

  it('allows registering change callbacks, and errors when an unsupported event is registered', function () {
    expect(function () {
      palette.on('change', callbackSpy1);
    }).not.toThrow();
    expect(function () {
      palette.on('someUnsupportedEvent', callbackSpy1);
    }).toThrow();
  });

  it('injects its callbacks with the new selected item on change', function () {
    palette.on('change', callbackSpy1);
    palette.on('change', callbackSpy2);
    palette.set('item2');
    expect(callbackSpy1).toHaveBeenCalledWith('item2');
    expect(callbackSpy2).toHaveBeenCalledWith('item2');
  });

  it('gracefully handles being set to an item not included in its set', function () {
    palette.set('foobar');
    expect(palette.getCurrent()).not.toEqual('foobar');
  });
});
