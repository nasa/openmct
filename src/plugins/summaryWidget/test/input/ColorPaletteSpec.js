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
import ColorPalette from '../../src/input/ColorPalette.js';

describe('An Open MCT color palette', function () {
  let colorPalette;
  let changeCallback;

  beforeEach(function () {
    changeCallback = jasmine.createSpy('changeCallback');
  });

  it('allows defining a custom color set', function () {
    colorPalette = new ColorPalette('someClass', 'someContainer', ['color1', 'color2', 'color3']);
    expect(colorPalette.getCurrent()).toEqual('color1');
    colorPalette.on('change', changeCallback);
    colorPalette.set('color2');
    expect(colorPalette.getCurrent()).toEqual('color2');
    expect(changeCallback).toHaveBeenCalledWith('color2');
  });

  it('loads with a default color set if one is not provided', function () {
    colorPalette = new ColorPalette('someClass', 'someContainer');
    expect(colorPalette.getCurrent()).toBeDefined();
  });
});
