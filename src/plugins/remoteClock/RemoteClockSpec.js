/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { createOpenMct, resetApplicationState } from 'utils/testing';

const REMOTE_CLOCK_KEY = 'remote-clock';
const TIME_TELEMETRY_ID = {
  namespace: 'remote',
  key: 'telemetry'
};
const TIME_VALUE = 12345;
const REQ_OPTIONS = {
  size: 1,
  strategy: 'latest'
};
const OFFSET_START = -10;
const OFFSET_END = 1;

describe('the RemoteClock plugin', () => {
  let openmct;
  let object = {
    name: 'remote-telemetry',
    identifier: TIME_TELEMETRY_ID
  };

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('once installed', () => {
    let remoteClock;
    let boundsCallback;
    let metadataValue = { some: 'value' };
    let timeSystem = { key: 'utc' };
    let metadata = {
      value: () => metadataValue
    };
    let reqDatum = {
      key: TIME_VALUE
    };

    let formatter = {
      parse: (datum) => datum.key
    };

    let objectPromise;
    let requestPromise;

    beforeEach(() => {
      openmct.install(openmct.plugins.RemoteClock(TIME_TELEMETRY_ID));

      let clocks = openmct.time.getAllClocks();
      remoteClock = clocks.filter((clock) => clock.key === REMOTE_CLOCK_KEY)[0];

      boundsCallback = jasmine.createSpy('boundsCallback');
      openmct.time.on('bounds', boundsCallback);

      spyOn(remoteClock, '_timeSystemChange').and.callThrough();
      spyOn(openmct.telemetry, 'getMetadata').and.returnValue(metadata);
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue(formatter);
      spyOn(openmct.telemetry, 'subscribe').and.callThrough();
      spyOn(openmct.time, 'on').and.callThrough();
      spyOn(openmct.time, 'timeSystem').and.returnValue(timeSystem);
      spyOn(metadata, 'value').and.callThrough();

      let requestPromiseResolve;
      let objectPromiseResolve;

      requestPromise = new Promise((resolve) => {
        requestPromiseResolve = resolve;
      });
      spyOn(openmct.telemetry, 'request').and.callFake(() => {
        requestPromiseResolve([reqDatum]);

        return requestPromise;
      });

      objectPromise = new Promise((resolve) => {
        objectPromiseResolve = resolve;
      });
      spyOn(openmct.objects, 'get').and.callFake(() => {
        objectPromiseResolve(object);

        return objectPromise;
      });

      openmct.time.clock(REMOTE_CLOCK_KEY, {
        start: OFFSET_START,
        end: OFFSET_END
      });
    });

    it('Does not throw error if time system is changed before remote clock initialized', () => {
      expect(() => openmct.time.timeSystem('utc')).not.toThrow();
    });

    describe('once resolved', () => {
      beforeEach(async () => {
        await Promise.all([objectPromise, requestPromise]);
      });

      it('is available and sets up initial values and listeners', () => {
        expect(remoteClock.key).toEqual(REMOTE_CLOCK_KEY);
        expect(remoteClock.identifier).toEqual(TIME_TELEMETRY_ID);
        expect(openmct.time.on).toHaveBeenCalledWith('timeSystem', remoteClock._timeSystemChange);
        expect(remoteClock._timeSystemChange).toHaveBeenCalled();
      });

      it('will request/store the object based on the identifier passed in', () => {
        expect(remoteClock.timeTelemetryObject).toEqual(object);
      });

      it('will request metadata and set up formatters', () => {
        expect(remoteClock.metadata).toEqual(metadata);
        expect(metadata.value).toHaveBeenCalled();
        expect(openmct.telemetry.getValueFormatter).toHaveBeenCalledWith(metadataValue);
      });

      it('will request the latest datum for the object it received and process the datum returned', () => {
        expect(openmct.telemetry.request).toHaveBeenCalledWith(
          remoteClock.timeTelemetryObject,
          REQ_OPTIONS
        );
        expect(boundsCallback).toHaveBeenCalledWith(
          {
            start: TIME_VALUE + OFFSET_START,
            end: TIME_VALUE + OFFSET_END
          },
          true
        );
      });

      it('will set up subscriptions correctly', () => {
        expect(remoteClock._unsubscribe).toBeDefined();
        expect(openmct.telemetry.subscribe).toHaveBeenCalledWith(
          remoteClock.timeTelemetryObject,
          remoteClock._processDatum
        );
      });
    });
  });
});
