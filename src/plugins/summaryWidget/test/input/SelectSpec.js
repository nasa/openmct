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
import Select from '../../src/input/Select.js';

describe('A select wrapper', function () {
  let select;
  let testOptions;
  let callbackSpy1;
  let callbackSpy2;
  beforeEach(function () {
    select = new Select();
    testOptions = [
      ['item1', 'Item 1'],
      ['item2', 'Item 2'],
      ['item3', 'Item 3']
    ];
    select.setOptions(testOptions);
    callbackSpy1 = jasmine.createSpy('callbackSpy1');
    callbackSpy2 = jasmine.createSpy('callbackSpy2');
  });

  it('gets and sets the current item', function () {
    select.setSelected('item1');
    expect(select.getSelected()).toEqual('item1');
  });

  it('allows adding a single new option', function () {
    select.addOption('newOption', 'A New Option');
    select.setSelected('newOption');
    expect(select.getSelected()).toEqual('newOption');
  });

  it('allows populating with a new set of options', function () {
    select.setOptions([
      ['newItem1', 'Item 1'],
      ['newItem2', 'Item 2']
    ]);
    select.setSelected('newItem1');
    expect(select.getSelected()).toEqual('newItem1');
  });

  it('allows registering change callbacks, and errors when an unsupported event is registered', function () {
    expect(function () {
      select.on('change', callbackSpy1);
    }).not.toThrow();
    expect(function () {
      select.on('someUnsupportedEvent', callbackSpy1);
    }).toThrow();
  });

  it('injects its callbacks with its property and value on a change', function () {
    select.on('change', callbackSpy1);
    select.on('change', callbackSpy2);
    select.setSelected('item2');
    expect(callbackSpy1).toHaveBeenCalledWith('item2');
    expect(callbackSpy2).toHaveBeenCalledWith('item2');
  });

  it('gracefully handles being set to an item not included in its set', function () {
    select.setSelected('foobar');
    expect(select.getSelected()).not.toEqual('foobar');
  });
});
