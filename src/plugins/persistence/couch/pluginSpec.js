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
import Vue from 'vue';
import CouchPlugin from './plugin.js';
import { createOpenMct, resetApplicationState, spyOnBuiltins } from 'utils/testing';
import { CONNECTED, DISCONNECTED, PENDING, UNKNOWN } from './CouchStatusIndicator';

describe('the plugin', () => {
  let openmct;
  let provider;
  let testPath = 'http://localhost:9990/openmct';
  let options;
  let mockIdentifierService;
  let mockDomainObject;

  beforeEach((done) => {
    spyOnBuiltins(['fetch'], window);

    mockDomainObject = {
      identifier: {
        namespace: '',
        key: 'some-value'
      },
      type: 'notebook',
      modified: 0
    };
    options = {
      url: testPath,
      filter: {}
    };
    openmct = createOpenMct();

    openmct.$injector = jasmine.createSpyObj('$injector', ['get']);
    mockIdentifierService = jasmine.createSpyObj('identifierService', ['parse']);
    mockIdentifierService.parse.and.returnValue({
      getSpace: () => {
        return 'mct';
      }
    });

    openmct.$injector.get.and.returnValue(mockIdentifierService);

    openmct.install(new CouchPlugin(options));

    openmct.types.addType('notebook', { creatable: true });

    openmct.on('start', done);
    openmct.startHeadless();

    provider = openmct.objects.getProvider(mockDomainObject.identifier);
    spyOn(provider, 'get').and.callThrough();
    spyOn(provider, 'create').and.callThrough();
    spyOn(provider, 'update').and.callThrough();
    spyOn(provider, 'observe').and.callThrough();
    spyOn(provider, 'fetchChanges').and.callThrough();
    spyOn(provider, 'onSharedWorkerMessage').and.callThrough();
    spyOn(provider, 'onEventMessage').and.callThrough();
    spyOn(provider, 'isObservingObjectChanges').and.callThrough();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the provider', () => {
    let mockPromise;
    beforeEach(() => {
      mockPromise = Promise.resolve({
        json: () => {
          return {
            ok: true,
            _id: 'some-value',
            id: 'some-value',
            _rev: 1,
            model: {}
          };
        }
      });
      fetch.and.returnValue(mockPromise);
    });

    it('gets an object', async () => {
      const result = await openmct.objects.get(mockDomainObject.identifier);
      expect(result.identifier.key).toEqual(mockDomainObject.identifier.key);
    });

    it('prioritizes couch requests above other requests', async () => {
      await openmct.objects.get(mockDomainObject.identifier);
      const fetchOptions = fetch.calls.mostRecent().args[1];
      expect(fetchOptions.priority).toEqual('high');
    });

    it('creates an object and starts shared worker', async () => {
      const result = await openmct.objects.save(mockDomainObject);
      expect(provider.create).toHaveBeenCalled();
      expect(provider.observe).toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('updates an object', (done) => {
      openmct.objects.save(mockDomainObject).then((result) => {
        expect(result).toBeTrue();
        expect(provider.create).toHaveBeenCalled();
        //Set modified timestamp it detects a change and persists the updated model.
        mockDomainObject.modified = mockDomainObject.persisted + 1;
        openmct.objects.save(mockDomainObject).then((updatedResult) => {
          expect(updatedResult).toBeTrue();
          expect(provider.update).toHaveBeenCalled();
          done();
        });
      });
    });

    it('works without Shared Workers', async () => {
      let sharedWorkerCallback;
      const cachedSharedWorker = window.SharedWorker;
      window.SharedWorker = undefined;

      const mockEventSource = {
        addEventListener: (topic, addedListener) => {
          sharedWorkerCallback = addedListener;
        },
        removeEventListener: () => {
          sharedWorkerCallback = null;
        }
      };
      const cachedEventSource = window.EventSource;

      window.EventSource = function (url) {
        return mockEventSource;
      };

      mockDomainObject.id = mockDomainObject.identifier.key;

      const fakeUpdateEvent = {
        data: JSON.stringify(mockDomainObject),
        target: {
          readyState: EventSource.CONNECTED
        }
      };

      // eslint-disable-next-line require-await
      provider.request = async function (subPath, method, body, signal) {
        return {
          body: fakeUpdateEvent,
          ok: true,
          id: mockDomainObject.id,
          rev: 5
        };
      };

      const result = await openmct.objects.save(mockDomainObject);
      expect(result).toBeTrue();
      expect(provider.create).toHaveBeenCalled();
      expect(provider.observe).toHaveBeenCalled();
      expect(provider.isObservingObjectChanges).toHaveBeenCalled();

      //Set modified timestamp it detects a change and persists the updated model.
      mockDomainObject.modified = mockDomainObject.persisted + 1;
      const updatedResult = await openmct.objects.save(mockDomainObject);
      openmct.objects.observe(mockDomainObject, '*', (updatedObject) => {});

      expect(updatedResult).toBeTrue();
      expect(provider.update).toHaveBeenCalled();
      expect(provider.fetchChanges).toHaveBeenCalled();
      expect(provider.isObservingObjectChanges.calls.mostRecent().returnValue).toBe(true);
      sharedWorkerCallback(fakeUpdateEvent);
      expect(provider.onEventMessage).toHaveBeenCalled();

      window.SharedWorker = cachedSharedWorker;
      window.EventSource = cachedEventSource;
    });
  });
  describe('batches requests', () => {
    let mockPromise;
    beforeEach(() => {
      mockPromise = Promise.resolve({
        json: () => {
          return {
            total_rows: 0,
            rows: []
          };
        }
      });
      fetch.and.returnValue(mockPromise);
    });
    it('for multiple simultaneous gets', async () => {
      const objectIds = [
        {
          namespace: '',
          key: 'object-1'
        },
        {
          namespace: '',
          key: 'object-2'
        },
        {
          namespace: '',
          key: 'object-3'
        }
      ];

      await Promise.all(objectIds.map((identifier) => openmct.objects.get(identifier)));

      const requestUrl = fetch.calls.mostRecent().args[0];
      const requestMethod = fetch.calls.mostRecent().args[1].method;
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(requestUrl.includes('_all_docs')).toBeTrue();
      expect(requestMethod).toEqual('POST');
    });

    it('but not for single gets', async () => {
      const objectId = {
        namespace: '',
        key: 'object-1'
      };

      await openmct.objects.get(objectId);
      const requestUrl = fetch.calls.mostRecent().args[0];
      const requestMethod = fetch.calls.mostRecent().args[1].method;

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(requestUrl.endsWith(`${objectId.key}`)).toBeTrue();
      expect(requestMethod).toEqual('GET');
    });
  });
  describe('batches persistence', () => {
    let successfulMockPromise;
    let partialFailureMockPromise;
    let objectsToPersist;

    beforeEach(() => {
      successfulMockPromise = Promise.resolve({
        json: () => {
          return [
            {
              id: 'object-1',
              ok: true
            },
            {
              id: 'object-2',
              ok: true
            },
            {
              id: 'object-3',
              ok: true
            }
          ];
        }
      });

      partialFailureMockPromise = Promise.resolve({
        json: () => {
          return [
            {
              id: 'object-1',
              ok: true
            },
            {
              id: 'object-2',
              ok: false
            },
            {
              id: 'object-3',
              ok: true
            }
          ];
        }
      });

      objectsToPersist = [
        {
          identifier: {
            namespace: '',
            key: 'object-1'
          },
          name: 'object-1',
          type: 'folder',
          modified: 0
        },
        {
          identifier: {
            namespace: '',
            key: 'object-2'
          },
          name: 'object-2',
          type: 'folder',
          modified: 0
        },
        {
          identifier: {
            namespace: '',
            key: 'object-3'
          },
          name: 'object-3',
          type: 'folder',
          modified: 0
        }
      ];
    });
    it('for multiple simultaneous successful saves', async () => {
      fetch.and.returnValue(successfulMockPromise);

      await Promise.all(
        objectsToPersist.map((objectToPersist) => openmct.objects.save(objectToPersist))
      );

      const requestUrl = fetch.calls.mostRecent().args[0];
      const requestMethod = fetch.calls.mostRecent().args[1].method;
      const requestBody = JSON.parse(fetch.calls.mostRecent().args[1].body);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(requestUrl.includes('_bulk_docs')).toBeTrue();
      expect(requestMethod).toEqual('POST');
      expect(
        objectsToPersist.every(
          (object, index) => object.identifier.key === requestBody.docs[index]._id
        )
      ).toBeTrue();
    });
    it('for multiple simultaneous saves with partial failure', async () => {
      fetch.and.returnValue(partialFailureMockPromise);

      let saveResults = await Promise.all(
        objectsToPersist.map((objectToPersist) =>
          openmct.objects
            .save(objectToPersist)
            .then(() => true)
            .catch(() => false)
        )
      );
      expect(saveResults[0]).toBeTrue();
      expect(saveResults[1]).toBeFalse();
      expect(saveResults[2]).toBeTrue();
    });
    it('except for a single save', async () => {
      fetch.and.returnValue({
        json: () => {
          return {
            id: 'object-1',
            ok: true
          };
        }
      });
      await openmct.objects.save(objectsToPersist[0]);

      const requestUrl = fetch.calls.mostRecent().args[0];
      const requestMethod = fetch.calls.mostRecent().args[1].method;

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(requestUrl.includes('_bulk_docs')).toBeFalse();
      expect(requestUrl.endsWith('object-1')).toBeTrue();
      expect(requestMethod).toEqual('PUT');
    });
  });
  describe('implements server-side search', () => {
    let mockPromise;
    beforeEach(() => {
      mockPromise = Promise.resolve({
        body: {
          getReader() {
            return {
              read() {
                return Promise.resolve({
                  done: true,
                  value: undefined
                });
              }
            };
          }
        }
      });
      fetch.and.returnValue(mockPromise);
    });

    it("using Couch's 'find' endpoint", async () => {
      await Promise.all(openmct.objects.search('test'));
      const requestUrl = fetch.calls.mostRecent().args[0];

      // we only want one call to fetch, not 2!
      // see https://github.com/nasa/openmct/issues/4667
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(requestUrl.endsWith('_find')).toBeTrue();
    });

    it('and supports search by object name', async () => {
      await Promise.all(openmct.objects.search('test'));
      const requestPayload = JSON.parse(fetch.calls.mostRecent().args[1].body);

      expect(requestPayload).toBeDefined();
      expect(requestPayload.selector.model.name.$regex).toEqual('(?i)test');
    });
  });
});

describe('the view', () => {
  let openmct;
  let options;
  let appHolder;
  let testPath = 'http://localhost:9990/openmct';
  let provider;
  let mockDomainObject;
  beforeEach((done) => {
    openmct = createOpenMct();
    spyOnBuiltins(['fetch'], window);
    options = {
      url: testPath,
      filter: {}
    };
    mockDomainObject = {
      identifier: {
        namespace: '',
        key: 'some-value'
      },
      type: 'notebook',
      modified: 0
    };
    openmct.install(new CouchPlugin(options));
    appHolder = document.createElement('div');
    document.body.appendChild(appHolder);
    openmct.on('start', done);
    openmct.start(appHolder);
    provider = openmct.objects.getProvider(mockDomainObject.identifier);
    spyOn(provider, 'onSharedWorkerMessage').and.callThrough();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('updates CouchDB status indicator', () => {
    let mockPromise;

    function assertCouchIndicatorStatus(status) {
      const indicator = appHolder.querySelector('.c-indicator--simple');
      expect(indicator).not.toBeNull();
      expect(indicator).toHaveClass(status.statusClass);
      expect(indicator.textContent).toMatch(new RegExp(status.text, 'i'));
      expect(indicator.title).toMatch(new RegExp(status.title, 'i'));
    }

    it("to 'connected' on successful request", async () => {
      mockPromise = Promise.resolve({
        status: 200,
        json: () => {
          return {
            ok: true,
            _id: 'some-value',
            id: 'some-value',
            _rev: 1,
            model: {}
          };
        }
      });
      fetch.and.returnValue(mockPromise);

      await openmct.objects.get({
        namespace: '',
        key: 'object-1'
      });
      await Vue.nextTick();

      assertCouchIndicatorStatus(CONNECTED);
    });

    it("to 'disconnected' on failed request", async () => {
      fetch.and.throwError(new TypeError('ERR_CONNECTION_REFUSED'));

      await openmct.objects.get({
        namespace: '',
        key: 'object-1'
      });
      await Vue.nextTick();

      assertCouchIndicatorStatus(DISCONNECTED);
    });

    it("to 'pending'", async () => {
      const workerMessage = {
        data: {
          type: 'state',
          state: 'pending'
        }
      };
      mockPromise = Promise.resolve({
        status: 200,
        json: () => {
          return {
            ok: true,
            _id: 'some-value',
            id: 'some-value',
            _rev: 1,
            model: {}
          };
        }
      });
      fetch.and.returnValue(mockPromise);

      await openmct.objects.get({
        namespace: '',
        key: 'object-1'
      });

      // Simulate 'pending' state from worker message
      provider.onSharedWorkerMessage(workerMessage);
      await Vue.nextTick();

      assertCouchIndicatorStatus(PENDING);
    });

    it("to 'unknown'", async () => {
      const workerMessage = {
        data: {
          type: 'state',
          state: 'unknown'
        }
      };
      mockPromise = Promise.resolve({
        status: 200,
        json: () => {
          return {
            ok: true,
            _id: 'some-value',
            id: 'some-value',
            _rev: 1,
            model: {}
          };
        }
      });
      fetch.and.returnValue(mockPromise);

      await openmct.objects.get({
        namespace: '',
        key: 'object-1'
      });

      // Simulate 'pending' state from worker message
      provider.onSharedWorkerMessage(workerMessage);
      await Vue.nextTick();

      assertCouchIndicatorStatus(UNKNOWN);
    });
  });
});
