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

import LocalClock from './LocalClock.js';
import UTCTimeSystem from './UTCTimeSystem';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import UTCTimeFormat from './UTCTimeFormat.js';

describe('The UTC Time System', () => {
  const UTC_SYSTEM_AND_FORMAT_KEY = 'utc';
  const DURATION_FORMAT_KEY = 'duration';
  let openmct;
  let utcTimeSystem;
  let mockTimeout;

  beforeEach(() => {
    openmct = createOpenMct();
    openmct.install(openmct.plugins.UTCTimeSystem());
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('plugin', function () {
    beforeEach(function () {
      mockTimeout = jasmine.createSpy('timeout');
      utcTimeSystem = new UTCTimeSystem(mockTimeout);
    });

    it('is installed', () => {
      let timeSystems = openmct.time.getAllTimeSystems();
      let utc = timeSystems.find((ts) => ts.key === UTC_SYSTEM_AND_FORMAT_KEY);

      expect(utc).not.toEqual(-1);
    });

    it('can be set to be the main time system', () => {
      openmct.time.timeSystem(UTC_SYSTEM_AND_FORMAT_KEY, {
        start: 0,
        end: 1
      });

      expect(openmct.time.timeSystem().key).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
    });

    it('uses the utc time format', () => {
      expect(utcTimeSystem.timeFormat).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
    });

    it('is UTC based', () => {
      expect(utcTimeSystem.isUTCBased).toBe(true);
    });

    it('defines expected metadata', () => {
      expect(utcTimeSystem.key).toBe(UTC_SYSTEM_AND_FORMAT_KEY);
      expect(utcTimeSystem.name).toBeDefined();
      expect(utcTimeSystem.cssClass).toBeDefined();
      expect(utcTimeSystem.durationFormat).toBeDefined();
    });
  });

  describe('LocalClock class', function () {
    let clock;
    const timeoutHandle = {};

    beforeEach(function () {
      mockTimeout = jasmine.createSpy('timeout');
      mockTimeout.and.returnValue(timeoutHandle);

      clock = new LocalClock(0);
      clock.start();
    });

    it('calls listeners on tick with current time', function () {
      const mockListener = jasmine.createSpy('listener');
      clock.on('tick', mockListener);
      clock.tick();
      expect(mockListener).toHaveBeenCalledWith(jasmine.any(Number));
    });
  });

  describe('UTC Time Format', () => {
    let utcTimeFormatter;

    beforeEach(() => {
      utcTimeFormatter = openmct.telemetry.getFormatter(UTC_SYSTEM_AND_FORMAT_KEY);
    });

    it('is installed by the plugin', () => {
      expect(utcTimeFormatter).toBeDefined();
    });

    it('formats from ms since Unix epoch into Open MCT UTC time format', () => {
      const TIME_IN_MS = 1638574560945;
      const TIME_AS_STRING = '2021-12-03 23:36:00.945Z';

      const formattedTime = utcTimeFormatter.format(TIME_IN_MS);
      expect(formattedTime).toEqual(TIME_AS_STRING);
    });

    it('formats from ms since Unix epoch into terse UTC formats', () => {
      const utcTimeFormatterInstance = new UTCTimeFormat();

      const TIME_IN_MS = 1638574560945;
      const EXPECTED_FORMATS = {
        PRECISION_DEFAULT: '2021-12-03 23:36:00.945',
        PRECISION_SECONDS: '2021-12-03 23:36:00',
        PRECISION_MINUTES: '2021-12-03 23:36',
        PRECISION_DAYS: '2021-12-03'
      };

      Object.keys(EXPECTED_FORMATS).forEach((formatKey) => {
        const formattedTime = utcTimeFormatterInstance.format(
          TIME_IN_MS,
          utcTimeFormatterInstance.DATE_FORMATS[formatKey]
        );
        expect(formattedTime).toEqual(EXPECTED_FORMATS[formatKey]);
      });
    });

    it('parses from Open MCT UTC time format to ms since Unix epoch.', () => {
      const TIME_IN_MS = 1638574560945;
      const TIME_AS_STRING = '2021-12-03 23:36:00.945Z';

      const parsedTime = utcTimeFormatter.parse(TIME_AS_STRING);
      expect(parsedTime).toEqual(TIME_IN_MS);
    });

    it('validates correctly formatted Open MCT UTC times.', () => {
      const TIME_AS_STRING = '2021-12-03 23:36:00.945Z';

      const isValid = utcTimeFormatter.validate(TIME_AS_STRING);
      expect(isValid).toBeTrue();
    });
  });

  describe('Duration Format', () => {
    let durationTimeFormatter;

    beforeEach(() => {
      durationTimeFormatter = openmct.telemetry.getFormatter(DURATION_FORMAT_KEY);
    });

    it('is installed by the plugin', () => {
      expect(durationTimeFormatter).toBeDefined();
    });

    it('formats from ms into Open MCT duration format', () => {
      const TIME_IN_MS = 2000;
      const TIME_AS_STRING = '00:00:02';

      const formattedTime = durationTimeFormatter.format(TIME_IN_MS);
      expect(formattedTime).toEqual(TIME_AS_STRING);
    });

    it('parses from Open MCT duration format to ms', () => {
      const TIME_IN_MS = 2000;
      const TIME_AS_STRING = '00:00:02';

      const parsedTime = durationTimeFormatter.parse(TIME_AS_STRING);
      expect(parsedTime).toEqual(TIME_IN_MS);
    });

    it('validates correctly formatted Open MCT duration strings.', () => {
      const TIME_AS_STRING = '00:00:02';

      const isValid = durationTimeFormatter.validate(TIME_AS_STRING);
      expect(isValid).toBeTrue();
    });
  });
});
