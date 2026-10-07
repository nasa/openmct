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

import { createOpenMct, resetApplicationState } from 'utils/testing';

const TELEMETRY_CLOCK_KEY = 'telemetry-clock';
const TICK_PERIOD = 100;
const NO_TICK_YET = 0;

describe('the TelemetryClock plugin', () => {
  let openmct;
  let telemetryClock;
  let tickCallback;
  let providerCallbacks;
  let domainObject;
  let timestampMetadataByTimeSystem;

  /**
   * Delivers a datum to every active subscription, as a telemetry provider
   * would.
   */
  function receiveTelemetry(timestamp) {
    providerCallbacks.forEach((providerCallback) => {
      providerCallback({ timestamp });
    });
  }

  function subscribeToTelemetry() {
    return openmct.telemetry.subscribe(domainObject, () => {});
  }

  function activateTelemetryClock() {
    openmct.time.setClock(TELEMETRY_CLOCK_KEY);
  }

  beforeEach((done) => {
    providerCallbacks = [];
    domainObject = {
      name: 'some-telemetry',
      type: 'sample-type',
      identifier: { namespace: 'test', key: 'telemetry' }
    };

    // Objects report a timestamp in UTC only, so that the time system change
    // behaviour can be exercised by switching to a system they do not support.
    timestampMetadataByTimeSystem = { utc: { key: 'utc', source: 'timestamp' } };

    openmct = createOpenMct();
    openmct.install(openmct.plugins.TelemetryClock(TICK_PERIOD));
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('once activated', () => {
    beforeEach(() => {
      openmct.telemetry.addProvider({
        supportsSubscribe: () => true,
        subscribe: (object, providerCallback) => {
          providerCallbacks.push(providerCallback);

          return () => {
            providerCallbacks = providerCallbacks.filter(
              (candidate) => candidate !== providerCallback
            );
          };
        }
      });

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        value: (timeSystemKey) => timestampMetadataByTimeSystem[timeSystemKey]
      });
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue({
        parse: (datum) => datum.timestamp
      });

      telemetryClock = openmct.time
        .getAllClocks()
        .filter((clock) => clock.key === TELEMETRY_CLOCK_KEY)[0];

      tickCallback = jasmine.createSpy('tickCallback');
      openmct.time.on('tick', tickCallback);

      jasmine.clock().install();
      jasmine.clock().mockDate();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
      openmct.time.setClock('local');
    });

    it('is registered with the expected identity', () => {
      expect(telemetryClock.key).toEqual(TELEMETRY_CLOCK_KEY);
      expect(telemetryClock.name).toEqual('Telemetry Clock');
    });

    it('does not tick before any telemetry has arrived', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      jasmine.clock().tick(TICK_PERIOD * 10);

      expect(tickCallback).not.toHaveBeenCalled();
      expect(telemetryClock.currentValue()).toEqual(NO_TICK_YET);
    });

    it('ticks immediately on the first datum, without waiting for the period', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);

      expect(tickCallback).toHaveBeenCalledOnceWith(1000);
      expect(telemetryClock.currentValue()).toEqual(1000);
    });

    it('coalesces a burst into a single tick carrying the newest timestamp', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      receiveTelemetry(1010);
      receiveTelemetry(1050);
      receiveTelemetry(1030);

      expect(tickCallback).toHaveBeenCalledTimes(1);

      jasmine.clock().tick(TICK_PERIOD);

      expect(tickCallback).toHaveBeenCalledTimes(2);
      expect(tickCallback).toHaveBeenCalledWith(1050);
    });

    it('never goes backwards', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD);

      receiveTelemetry(500);
      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD * 5);

      expect(tickCallback).toHaveBeenCalledTimes(1);
      expect(telemetryClock.currentValue()).toEqual(1000);
    });

    it('stops ticking, and leaves no timer armed, when telemetry stops', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD * 10);

      const tickCountWhenTelemetryStopped = tickCallback.calls.count();

      jasmine.clock().tick(TICK_PERIOD * 100);

      expect(tickCallback).toHaveBeenCalledTimes(tickCountWhenTelemetryStopped);
      expect(telemetryClock.currentValue()).toEqual(1000);
    });

    it('ticks immediately again after an idle gap', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD * 10);
      tickCallback.calls.reset();

      receiveTelemetry(2000);

      expect(tickCallback).toHaveBeenCalledOnceWith(2000);
    });

    it('observes subscriptions that already existed when it was activated', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);

      expect(tickCallback).toHaveBeenCalledOnceWith(1000);
    });

    it('observes subscriptions created after it was activated', () => {
      activateTelemetryClock();
      subscribeToTelemetry();

      receiveTelemetry(1000);

      expect(tickCallback).toHaveBeenCalledOnceWith(1000);
    });

    it('ignores objects that carry no timestamp in the active time system', () => {
      timestampMetadataByTimeSystem = {};

      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD * 5);

      expect(tickCallback).not.toHaveBeenCalled();
    });

    it('stops observing telemetry once another clock is selected', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD);
      openmct.time.setClock('local');
      tickCallback.calls.reset();

      receiveTelemetry(5000);
      jasmine.clock().tick(TICK_PERIOD);

      expect(tickCallback).not.toHaveBeenCalledWith(5000);
    });

    it('retains the time it reached when switched away from and back', () => {
      subscribeToTelemetry();
      activateTelemetryClock();

      receiveTelemetry(1000);
      jasmine.clock().tick(TICK_PERIOD);

      openmct.time.setClock('local');
      activateTelemetryClock();

      expect(telemetryClock.currentValue()).toEqual(1000);

      receiveTelemetry(500);
      jasmine.clock().tick(TICK_PERIOD * 5);

      expect(telemetryClock.currentValue()).toEqual(1000);
    });

    describe('when the time system changes', () => {
      beforeEach(() => {
        subscribeToTelemetry();
        activateTelemetryClock();

        receiveTelemetry(1000);
        jasmine.clock().tick(TICK_PERIOD);
        tickCallback.calls.reset();
      });

      it('returns to its un-ticked state, because timestamps are not comparable across time systems', () => {
        timestampMetadataByTimeSystem = { other: { key: 'other', source: 'timestamp' } };
        openmct.time.addTimeSystem({
          key: 'other',
          name: 'Other',
          timeFormat: 'utc',
          durationFormat: 'duration',
          isUTCBased: false
        });
        openmct.time.setTimeSystem('other', { start: 0, end: 1 });

        expect(telemetryClock.currentValue()).toEqual(NO_TICK_YET);
      });

      it('accepts a timestamp that would have been rejected under the previous time system', () => {
        timestampMetadataByTimeSystem = { other: { key: 'other', source: 'timestamp' } };
        openmct.time.addTimeSystem({
          key: 'other',
          name: 'Other',
          timeFormat: 'utc',
          durationFormat: 'duration',
          isUTCBased: false
        });
        openmct.time.setTimeSystem('other', { start: 0, end: 1 });

        receiveTelemetry(10);

        expect(tickCallback).toHaveBeenCalledWith(10);
      });
    });
  });
});
