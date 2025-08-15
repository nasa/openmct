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

import TelemetryAPI from './TelemetryAPI.js';
import TelemetryCollection from './TelemetryCollection.js';

describe('Telemetry API', () => {
  let openmct;
  let telemetryAPI;

  beforeEach(() => {
    openmct = {
      time: jasmine.createSpyObj('timeAPI', ['timeSystem', 'getTimeSystem', 'bounds', 'getBounds']),
      types: jasmine.createSpyObj('typeRegistry', ['get'])
    };

    openmct.time.timeSystem.and.returnValue({ key: 'system' });
    openmct.time.getTimeSystem.and.returnValue({ key: 'system' });
    openmct.time.bounds.and.returnValue({
      start: 0,
      end: 1
    });
    openmct.time.getBounds.and.returnValue({
      start: 0,
      end: 1
    });
    telemetryAPI = new TelemetryAPI(openmct);
  });

  describe('Telemetry providers', () => {
    let telemetryProvider;
    let domainObject;

    beforeEach(() => {
      telemetryProvider = jasmine.createSpyObj('telemetryProvider', [
        'supportsSubscribe',
        'subscribe',
        'supportsRequest',
        'request'
      ]);
      domainObject = {
        identifier: {
          key: 'a',
          namespace: 'b'
        },
        type: 'sample-type'
      };

      openmct.notifications = {
        error: () => {
          console.log('sample error notification');
        }
      };
    });

    it('provides consistent results without providers', async () => {
      const unsubscribe = telemetryAPI.subscribe(domainObject);

      expect(unsubscribe).toEqual(jasmine.any(Function));

      const data = await telemetryAPI.request(domainObject);
      expect(data).toEqual([]);
    });

    it('skips providers that do not match', async () => {
      telemetryProvider.supportsSubscribe.and.returnValue(false);
      telemetryProvider.supportsRequest.and.returnValue(false);
      telemetryProvider.request.and.returnValue(Promise.resolve([]));
      telemetryAPI.addProvider(telemetryProvider);

      const callback = jasmine.createSpy('callback');
      const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      expect(telemetryProvider.supportsSubscribe).toHaveBeenCalledWith(domainObject, {
        strategy: 'latest'
      });
      expect(telemetryProvider.subscribe).not.toHaveBeenCalled();
      expect(unsubscribe).toEqual(jasmine.any(Function));

      await telemetryAPI.request(domainObject);
      expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
        domainObject,
        jasmine.any(Object)
      );
      expect(telemetryProvider.request).not.toHaveBeenCalled();
    });

    it('sends subscribe calls to matching providers', () => {
      const unsubFunc = jasmine.createSpy('unsubscribe');
      telemetryProvider.subscribe.and.returnValue(unsubFunc);
      telemetryProvider.supportsSubscribe.and.returnValue(true);
      telemetryAPI.addProvider(telemetryProvider);

      const callback = jasmine.createSpy('callback');
      const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      expect(telemetryProvider.supportsSubscribe.calls.count()).toBe(1);
      expect(telemetryProvider.supportsSubscribe).toHaveBeenCalledWith(domainObject, {
        strategy: 'latest'
      });
      expect(telemetryProvider.subscribe.calls.count()).toBe(1);
      expect(telemetryProvider.subscribe).toHaveBeenCalledWith(
        domainObject,
        jasmine.any(Function),
        {
          strategy: 'latest'
        }
      );

      const notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
      notify('someValue');
      expect(callback).toHaveBeenCalledWith('someValue');

      expect(unsubscribe).toEqual(jasmine.any(Function));
      expect(unsubFunc).not.toHaveBeenCalled();
      unsubscribe();
      expect(unsubFunc).toHaveBeenCalled();

      notify('otherValue');
      expect(callback).not.toHaveBeenCalledWith('otherValue');
    });

    it('subscribes once per object', () => {
      const unsubFunc = jasmine.createSpy('unsubscribe');
      telemetryProvider.subscribe.and.returnValue(unsubFunc);
      telemetryProvider.supportsSubscribe.and.returnValue(true);
      telemetryAPI.addProvider(telemetryProvider);

      const callback = jasmine.createSpy('callback');
      const callbacktwo = jasmine.createSpy('callback two');
      const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      const unsubscribetwo = telemetryAPI.subscribe(domainObject, callbacktwo);

      expect(telemetryProvider.subscribe.calls.count()).toBe(1);

      const notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
      notify('someValue');
      expect(callback).toHaveBeenCalledWith('someValue');
      expect(callbacktwo).toHaveBeenCalledWith('someValue');

      unsubscribe();
      expect(unsubFunc).not.toHaveBeenCalled();
      notify('otherValue');
      expect(callback).not.toHaveBeenCalledWith('otherValue');
      expect(callbacktwo).toHaveBeenCalledWith('otherValue');

      unsubscribetwo();
      expect(unsubFunc).toHaveBeenCalled();
      notify('anotherValue');
      expect(callback).not.toHaveBeenCalledWith('anotherValue');
      expect(callbacktwo).not.toHaveBeenCalledWith('anotherValue');
    });

    it('only deletes subscription cache when there are no more subscribers', () => {
      const unsubFunc = jasmine.createSpy('unsubscribe');
      telemetryProvider.subscribe.and.returnValue(unsubFunc);
      telemetryProvider.supportsSubscribe.and.returnValue(true);
      telemetryAPI.addProvider(telemetryProvider);

      const callback = jasmine.createSpy('callback');
      const callbacktwo = jasmine.createSpy('callback two');
      const callbackThree = jasmine.createSpy('callback three');
      const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      const unsubscribeTwo = telemetryAPI.subscribe(domainObject, callbacktwo);

      expect(telemetryProvider.subscribe.calls.count()).toBe(1);
      unsubscribe();
      const unsubscribeThree = telemetryAPI.subscribe(domainObject, callbackThree);
      // Regression test for where subscription cache was deleted on each unsubscribe, resulting in
      // superfluous additional subscriptions. If the subscription cache is being deleted on each unsubscribe,
      // then a subsequent subscribe will result in a new subscription at the provider.
      expect(telemetryProvider.subscribe.calls.count()).toBe(1);
      unsubscribeTwo();
      unsubscribeThree();
    });

    it('does subscribe/unsubscribe', () => {
      const unsubFunc = jasmine.createSpy('unsubscribe');
      telemetryProvider.subscribe.and.returnValue(unsubFunc);
      telemetryProvider.supportsSubscribe.and.returnValue(true);
      telemetryAPI.addProvider(telemetryProvider);

      const callback = jasmine.createSpy('callback');
      let unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      expect(telemetryProvider.subscribe.calls.count()).toBe(1);
      unsubscribe();

      unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      expect(telemetryProvider.subscribe.calls.count()).toBe(2);
      unsubscribe();
    });

    it('subscribes for different object', () => {
      const unsubFuncs = [];
      const notifiers = [];
      telemetryProvider.supportsSubscribe.and.returnValue(true);
      telemetryProvider.subscribe.and.callFake(function (obj, cb) {
        const unsubFunc = jasmine.createSpy('unsubscribe ' + unsubFuncs.length);
        unsubFuncs.push(unsubFunc);
        notifiers.push(cb);

        return unsubFunc;
      });
      telemetryAPI.addProvider(telemetryProvider);

      const otherDomainObject = JSON.parse(JSON.stringify(domainObject));
      otherDomainObject.identifier.namespace = 'other';

      const callback = jasmine.createSpy('callback');
      const callbacktwo = jasmine.createSpy('callback two');

      const unsubscribe = telemetryAPI.subscribe(domainObject, callback);
      const unsubscribetwo = telemetryAPI.subscribe(otherDomainObject, callbacktwo);

      expect(telemetryProvider.subscribe.calls.count()).toBe(2);

      notifiers[0]('someValue');
      expect(callback).toHaveBeenCalledWith('someValue');
      expect(callbacktwo).not.toHaveBeenCalledWith('someValue');

      notifiers[1]('anotherValue');
      expect(callback).not.toHaveBeenCalledWith('anotherValue');
      expect(callbacktwo).toHaveBeenCalledWith('anotherValue');

      unsubscribe();
      expect(unsubFuncs[0]).toHaveBeenCalled();
      expect(unsubFuncs[1]).not.toHaveBeenCalled();

      unsubscribetwo();
      expect(unsubFuncs[1]).toHaveBeenCalled();
    });

    it('sends requests to matching providers', async () => {
      const telemPromise = Promise.resolve([]);
      telemetryProvider.supportsRequest.and.returnValue(true);
      telemetryProvider.request.and.returnValue(telemPromise);
      telemetryAPI.addProvider(telemetryProvider);

      await telemetryAPI.request(domainObject);
      expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
        domainObject,
        jasmine.any(Object)
      );
      expect(telemetryProvider.request).toHaveBeenCalledWith(domainObject, jasmine.any(Object));
    });

    it('generates default request options', async () => {
      telemetryProvider.supportsRequest.and.returnValue(true);
      telemetryProvider.request.and.returnValue(Promise.resolve([]));
      telemetryAPI.addProvider(telemetryProvider);

      await telemetryAPI.request(domainObject);
      const { signal } = new AbortController();
      expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(jasmine.any(Object), {
        signal,
        start: 0,
        end: 1,
        domain: 'system'
      });

      expect(telemetryProvider.request).toHaveBeenCalledWith(jasmine.any(Object), {
        signal,
        start: 0,
        end: 1,
        domain: 'system'
      });

      telemetryProvider.supportsRequest.calls.reset();
      telemetryProvider.request.calls.reset();

      await telemetryAPI.request(domainObject, {});
      expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(jasmine.any(Object), {
        signal,
        start: 0,
        end: 1,
        domain: 'system'
      });

      expect(telemetryProvider.request).toHaveBeenCalledWith(jasmine.any(Object), {
        signal,
        start: 0,
        end: 1,
        domain: 'system'
      });
    });

    it('do not overwrite existing request options', async () => {
      telemetryProvider.supportsRequest.and.returnValue(true);
      telemetryProvider.request.and.returnValue(Promise.resolve([]));
      telemetryAPI.addProvider(telemetryProvider);

      await telemetryAPI.request(domainObject, {
        start: 20,
        end: 30,
        domain: 'someDomain'
      });
      const { signal } = new AbortController();
      expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(jasmine.any(Object), {
        start: 20,
        end: 30,
        domain: 'someDomain',
        signal
      });

      expect(telemetryProvider.request).toHaveBeenCalledWith(jasmine.any(Object), {
        start: 20,
        end: 30,
        domain: 'someDomain',
        signal
      });
    });
    describe('telemetry batching support', () => {
      let callbacks;
      let unsubFunc;

      beforeEach(() => {
        callbacks = [];
        unsubFunc = jasmine.createSpy('unsubscribe');
        telemetryProvider.supportsBatching = jasmine.createSpy('supportsBatching');
        telemetryProvider.supportsBatching.and.returnValue(true);
        telemetryProvider.supportsSubscribe.and.returnValue(true);

        telemetryProvider.subscribe.and.callFake(function (obj, cb, options) {
          callbacks.push(cb);

          return unsubFunc;
        });

        telemetryAPI.addProvider(telemetryProvider);
      });

      it('caches subscriptions for batched and latest telemetry subscriptions', () => {
        const latestCallback1 = jasmine.createSpy('latestCallback1');
        const unsubscribeFromLatest1 = telemetryAPI.subscribe(domainObject, latestCallback1, {
          strategy: 'latest'
        });
        const latestCallback2 = jasmine.createSpy('latestCallback2');
        const unsubscribeFromLatest2 = telemetryAPI.subscribe(domainObject, latestCallback2, {
          strategy: 'latest'
        });

        //Expect a single cached subscription for latest telemetry
        expect(telemetryProvider.subscribe.calls.count()).toBe(1);

        const batchedCallback1 = jasmine.createSpy('batchedCallback1');
        const unsubscribeFromBatched1 = telemetryAPI.subscribe(domainObject, batchedCallback1, {
          strategy: 'batch'
        });

        const batchedCallback2 = jasmine.createSpy('batchedCallback2');
        const unsubscribeFromBatched2 = telemetryAPI.subscribe(domainObject, batchedCallback2, {
          strategy: 'batch'
        });

        //Expect a single cached subscription for each strategy telemetry
        expect(telemetryProvider.subscribe.calls.count()).toBe(2);

        unsubscribeFromLatest1();
        unsubscribeFromLatest2();
        unsubscribeFromBatched1();
        unsubscribeFromBatched2();

        expect(unsubFunc).toHaveBeenCalledTimes(2);
      });
      it('subscriptions with the latest strategy are always invoked with a single value', () => {
        const latestCallback = jasmine.createSpy('latestCallback1');
        telemetryAPI.subscribe(domainObject, latestCallback, {
          strategy: 'latest'
        });

        const batchedValues = [1, 2, 3];
        callbacks.forEach((cb) => {
          cb(batchedValues);
        });

        expect(latestCallback).toHaveBeenCalledWith(3);

        const singleValue = 1;
        callbacks.forEach((cb) => {
          cb(singleValue);
        });

        expect(latestCallback).toHaveBeenCalledWith(1);
      });

      it('subscriptions with the batch strategy are always invoked with an array', () => {
        const batchedCallback = jasmine.createSpy('batchedCallback1');
        const latestCallback = jasmine.createSpy('latestCallback1');
        telemetryAPI.subscribe(domainObject, batchedCallback, {
          strategy: 'batch'
        });
        telemetryAPI.subscribe(domainObject, latestCallback, {
          strategy: 'latest'
        });

        const batchedValues = [1, 2, 3];
        callbacks.forEach((cb) => {
          cb(batchedValues);
        });

        // Callbacks for the 'batch' strategy are always called with an array of values
        expect(batchedCallback).toHaveBeenCalledWith(batchedValues);
        // Callbacks for the 'latest' strategy are always called with a single value
        expect(latestCallback).toHaveBeenCalledWith(3);

        callbacks.forEach((cb) => {
          cb(1);
        });
        // Callbacks for the 'batch' strategy are always called with an array of values, even if there is only one value
        expect(batchedCallback).toHaveBeenCalledWith([1]);
        // Callbacks for the 'latest' strategy are always called with a single value
        expect(latestCallback).toHaveBeenCalledWith(1);
      });

      it('legacy providers are left unchanged, with a single subscription', () => {
        delete telemetryProvider.supportsBatching;

        const batchCallback = jasmine.createSpy('batchCallback');
        telemetryAPI.subscribe(domainObject, batchCallback, {
          strategy: 'batch'
        });
        expect(telemetryProvider.subscribe.calls.mostRecent().args[2].strategy).toBe('latest');

        const latestCallback = jasmine.createSpy('latestCallback');
        telemetryAPI.subscribe(domainObject, latestCallback, {
          strategy: 'latest'
        });

        expect(telemetryProvider.subscribe.calls.mostRecent().args[2].strategy).toBe('latest');
      });
    });
  });

  describe('metadata', () => {
    let mockMetadata = {};
    let mockObjectType = {
      definition: {}
    };
    beforeEach(() => {
      telemetryAPI.addProvider({
        key: 'mockMetadataProvider',
        supportsMetadata() {
          return true;
        },
        getMetadata() {
          return mockMetadata;
        }
      });
      openmct.types.get.and.returnValue(mockObjectType);
    });

    it('respects explicit priority', () => {
      mockMetadata.values = [
        {
          key: 'name',
          name: 'Name',
          hints: {
            priority: 2
          }
        },
        {
          key: 'timestamp',
          name: 'Timestamp',
          hints: {
            priority: 1
          }
        },
        {
          key: 'sin',
          name: 'Sine',
          hints: {
            priority: 4
          }
        },
        {
          key: 'cos',
          name: 'Cosine',
          hints: {
            priority: 3
          }
        }
      ];
      let metadata = telemetryAPI.getMetadata({});
      let values = metadata.values();

      values.forEach((value, index) => {
        expect(value.hints.priority).toBe(index + 1);
      });
    });
    it('if no explicit priority, defaults to order defined', () => {
      mockMetadata.values = [
        {
          key: 'name',
          name: 'Name'
        },
        {
          key: 'timestamp',
          name: 'Timestamp'
        },
        {
          key: 'sin',
          name: 'Sine'
        },
        {
          key: 'cos',
          name: 'Cosine'
        }
      ];
      let metadata = telemetryAPI.getMetadata({});
      let values = metadata.values();

      values.forEach((value, index) => {
        expect(value.key).toBe(mockMetadata.values[index].key);
      });
    });
    it('respects domain priority', () => {
      mockMetadata.values = [
        {
          key: 'name',
          name: 'Name'
        },
        {
          key: 'timestamp-utc',
          name: 'Timestamp UTC',
          hints: {
            domain: 2
          }
        },
        {
          key: 'timestamp-local',
          name: 'Timestamp Local',
          hints: {
            domain: 1
          }
        },
        {
          key: 'sin',
          name: 'Sine',
          hints: {
            range: 2
          }
        },
        {
          key: 'cos',
          name: 'Cosine',
          hints: {
            range: 1
          }
        }
      ];
      let metadata = telemetryAPI.getMetadata({});
      let values = metadata.valuesForHints(['domain']);

      expect(values[0].key).toBe('timestamp-local');
      expect(values[1].key).toBe('timestamp-utc');
    });
    it('respects range priority', () => {
      mockMetadata.values = [
        {
          key: 'name',
          name: 'Name'
        },
        {
          key: 'timestamp-utc',
          name: 'Timestamp UTC',
          hints: {
            domain: 2
          }
        },
        {
          key: 'timestamp-local',
          name: 'Timestamp Local',
          hints: {
            domain: 1
          }
        },
        {
          key: 'sin',
          name: 'Sine',
          hints: {
            range: 2
          }
        },
        {
          key: 'cos',
          name: 'Cosine',
          hints: {
            range: 1
          }
        }
      ];
      let metadata = telemetryAPI.getMetadata({});
      let values = metadata.valuesForHints(['range']);

      expect(values[0].key).toBe('cos');
      expect(values[1].key).toBe('sin');
    });
    it('respects priority and domain ordering', () => {
      mockMetadata.values = [
        {
          key: 'id',
          name: 'ID',
          hints: {
            priority: 2
          }
        },
        {
          key: 'name',
          name: 'Name',
          hints: {
            priority: 1
          }
        },
        {
          key: 'timestamp-utc',
          name: 'Timestamp UTC',
          hints: {
            domain: 2,
            priority: 1
          }
        },
        {
          key: 'timestamp-local',
          name: 'Timestamp Local',
          hints: {
            domain: 1,
            priority: 2
          }
        },
        {
          key: 'timestamp-pst',
          name: 'Timestamp PST',
          hints: {
            domain: 3,
            priority: 2
          }
        },
        {
          key: 'sin',
          name: 'Sine'
        },
        {
          key: 'cos',
          name: 'Cosine'
        }
      ];
      let metadata = telemetryAPI.getMetadata({});
      let values = metadata.valuesForHints(['priority', 'domain']);
      ['timestamp-utc', 'timestamp-local', 'timestamp-pst'].forEach((key, index) => {
        expect(values[index].key).toBe(key);
      });
    });
  });

  describe('telemetry collections', () => {
    let domainObject;
    let mockMetadata = {};
    let mockObjectType = {
      definition: {}
    };

    beforeEach(() => {
      openmct.telemetry = telemetryAPI;
      telemetryAPI.addProvider({
        key: 'mockMetadataProvider',
        supportsMetadata() {
          return true;
        },
        getMetadata() {
          return mockMetadata;
        }
      });
      openmct.types.get.and.returnValue(mockObjectType);
      domainObject = {
        identifier: {
          key: 'a',
          namespace: 'b'
        },
        type: 'sample-type'
      };
    });

    it('when requested, returns an instance of telemetry collection', () => {
      const telemetryCollection = telemetryAPI.requestCollection(domainObject);

      expect(telemetryCollection).toBeInstanceOf(TelemetryCollection);
    });
  });
});

describe('telemetry', () => {
  let openmct;
  let telemetryProvider;
  let telemetryAPI;
  let watchedSignal;

  beforeEach(() => {
    openmct = createOpenMct();
    openmct.install(openmct.plugins.MyItems());

    telemetryAPI = openmct.telemetry;

    telemetryProvider = {
      request: (obj, options) => {
        watchedSignal = options.signal;

        return Promise.resolve();
      }
    };
    spyOn(telemetryAPI, 'findRequestProvider').and.returnValue(telemetryProvider);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('should not abort request without navigation', async () => {
    telemetryAPI.addProvider(telemetryProvider);

    await telemetryAPI.request({});
    expect(watchedSignal.aborted).toBe(false);
  });

  it('should abort request on navigation', (done) => {
    telemetryAPI.addProvider(telemetryProvider);

    telemetryAPI.request({}).finally(() => {
      expect(watchedSignal.aborted).toBe(true);
      done();
    });
    openmct.router.doPathChange('newPath', 'oldPath');
  });
});
