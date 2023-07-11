/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import DeviceMatchers from './DeviceMatchers';

describe('DeviceMatchers', function () {
  let mockAgent;

  beforeEach(function () {
    mockAgent = jasmine.createSpyObj('agent', [
      'isMobile',
      'isPhone',
      'isTablet',
      'isPortrait',
      'isLandscape',
      'isTouch'
    ]);
  });

  it('detects when a device is a desktop device', function () {
    mockAgent.isMobile.and.returnValue(false);
    expect(DeviceMatchers.desktop(mockAgent)).toBe(true);
    mockAgent.isMobile.and.returnValue(true);
    expect(DeviceMatchers.desktop(mockAgent)).toBe(false);
  });

  function method(deviceType) {
    return 'is' + deviceType[0].toUpperCase() + deviceType.slice(1);
  }

  ['mobile', 'phone', 'tablet', 'landscape', 'portrait', 'landscape', 'touch'].forEach(function (
    deviceType
  ) {
    it('detects when a device is a ' + deviceType + ' device', function () {
      mockAgent[method(deviceType)].and.returnValue(true);
      expect(DeviceMatchers[deviceType](mockAgent)).toBe(true);
      mockAgent[method(deviceType)].and.returnValue(false);
      expect(DeviceMatchers[deviceType](mockAgent)).toBe(false);
    });
  });
});
