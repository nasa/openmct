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
import IconPalette from '../../src/input/IconPalette.js';

describe('An Open MCT icon palette', function () {
  let iconPalette;
  let changeCallback;

  beforeEach(function () {
    changeCallback = jasmine.createSpy('changeCallback');
  });

  it('allows defining a custom icon set', function () {
    iconPalette = new IconPalette('', 'someContainer', ['icon1', 'icon2', 'icon3']);
    expect(iconPalette.getCurrent()).toEqual('icon1');
    iconPalette.on('change', changeCallback);
    iconPalette.set('icon2');
    expect(iconPalette.getCurrent()).toEqual('icon2');
    expect(changeCallback).toHaveBeenCalledWith('icon2');
  });

  it('loads with a default icon set if one is not provided', function () {
    iconPalette = new IconPalette('someClass', 'someContainer');
    expect(iconPalette.getCurrent()).toBeDefined();
  });
});
