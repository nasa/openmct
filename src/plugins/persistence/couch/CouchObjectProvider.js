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

import CouchDocument from './CouchDocument';
import CouchObjectQueue from './CouchObjectQueue';
import { PENDING, CONNECTED, DISCONNECTED, UNKNOWN } from './CouchStatusIndicator';
import { isNotebookOrAnnotationType } from '../../notebook/notebook-constants.js';
import _ from 'lodash';

const REV = '_rev';
const ID = '_id';
const HEARTBEAT = 50000;
const ALL_DOCS = '_all_docs?include_docs=true';

class CouchObjectProvider {
  constructor(openmct, options, namespace, indicator) {
    options = this.#normalize(options);
    this.openmct = openmct;
    this.indicator = indicator;
    this.url = options.url;
    this.namespace = namespace;
    this.objectQueue = {};
    this.observers = {};
    this.batchIds = [];
    this.onEventMessage = this.onEventMessage.bind(this);
    this.onEventError = this.onEventError.bind(this);
    this.flushPersistenceQueue = _.debounce(this.flushPersistenceQueue.bind(this));
    this.persistenceQueue = [];
  }

  /**
   * @private
   */
  #startSharedWorker() {
    let provider = this;
    let sharedWorker;

    // eslint-disable-next-line no-undef
    const sharedWorkerURL = `${this.openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}couchDBChangesFeed.js`;

    sharedWorker = new SharedWorker(sharedWorkerURL, 'CouchDB SSE Shared Worker');
    sharedWorker.port.onmessage = provider.onSharedWorkerMessage.bind(this);
    sharedWorker.port.onmessageerror = provider.onSharedWorkerMessageError.bind(this);
    sharedWorker.port.start();

    this.openmct.on('destroy', () => {
      this.changesFeedSharedWorker.port.postMessage({
        request: 'close',
        connectionId: this.changesFeedSharedWorkerConnectionId
      });
      this.changesFeedSharedWorker.port.close();
    });

    return sharedWorker;
  }

  onSharedWorkerMessageError(event) {
    console.error('Error', event);
  }

  isSynchronizedObject(object) {
    return (
      object &&
      object.type &&
      this.openmct.objects.SYNCHRONIZED_OBJECT_TYPES &&
      this.openmct.objects.SYNCHRONIZED_OBJECT_TYPES.includes(object.type)
    );
  }

  onSharedWorkerMessage(event) {
    if (event.data.type === 'connection') {
      this.changesFeedSharedWorkerConnectionId = event.data.connectionId;
    } else if (event.data.type === 'state') {
      const state = this.#messageToIndicatorState(event.data.state);
      this.indicator.setIndicatorToState(state);
    } else {
      let objectChanges = event.data.objectChanges;
      const objectIdentifier = {
        namespace: this.namespace,
        key: objectChanges.id
      };
      let keyString = this.openmct.objects.makeKeyString(objectIdentifier);
      //TODO: Optimize this so that we don't 'get' the object if it's current revision (from this.objectQueue) is the same as the one we already have.
      let observersForObject = this.observers[keyString];
      let isInTransaction = false;

      if (this.openmct.objects.isTransactionActive()) {
        isInTransaction = this.openmct.objects.transaction.getDirtyObject(objectIdentifier);
      }

      if (observersForObject && !isInTransaction) {
        observersForObject.forEach(async (observer) => {
          const updatedObject = await this.get(objectIdentifier);
          if (this.isSynchronizedObject(updatedObject)) {
            observer(updatedObject);
          }
        });
      }
    }
  }

  /**
   * Takes in a state message from the CouchDB SharedWorker and returns an IndicatorState.
   * @private
   * @param {'open'|'close'|'pending'} message
   * @returns {import('./CouchStatusIndicator').IndicatorState}
   */
  #messageToIndicatorState(message) {
    let state;
    switch (message) {
      case 'open':
        state = CONNECTED;
        break;
      case 'close':
        state = DISCONNECTED;
        break;
      case 'pending':
        state = PENDING;
        break;
      case 'unknown':
        state = UNKNOWN;
        break;
    }

    return state;
  }

  /**
   * Takes an HTTP status code and returns an IndicatorState
   * @private
   * @param {number} statusCode
   * @returns {import("./CouchStatusIndicator").IndicatorState}
   */
  #statusCodeToIndicatorState(statusCode) {
    let state;
    switch (statusCode) {
      case CouchObjectProvider.HTTP_OK:
      case CouchObjectProvider.HTTP_CREATED:
      case CouchObjectProvider.HTTP_ACCEPTED:
      case CouchObjectProvider.HTTP_NOT_MODIFIED:
      case CouchObjectProvider.HTTP_BAD_REQUEST:
      case CouchObjectProvider.HTTP_UNAUTHORIZED:
      case CouchObjectProvider.HTTP_FORBIDDEN:
      case CouchObjectProvider.HTTP_NOT_FOUND:
      case CouchObjectProvider.HTTP_METHOD_NOT_ALLOWED:
      case CouchObjectProvider.HTTP_NOT_ACCEPTABLE:
      case CouchObjectProvider.HTTP_CONFLICT:
      case CouchObjectProvider.HTTP_PRECONDITION_FAILED:
      case CouchObjectProvider.HTTP_REQUEST_ENTITY_TOO_LARGE:
      case CouchObjectProvider.HTTP_UNSUPPORTED_MEDIA_TYPE:
      case CouchObjectProvider.HTTP_REQUESTED_RANGE_NOT_SATISFIABLE:
      case CouchObjectProvider.HTTP_EXPECTATION_FAILED:
      case CouchObjectProvider.HTTP_SERVER_ERROR:
        state = CONNECTED;
        break;
      case CouchObjectProvider.HTTP_SERVICE_UNAVAILABLE:
        state = DISCONNECTED;
        break;
      default:
        state = UNKNOWN;
    }

    return state;
  }

  //backwards compatibility, options used to be a url. Now it's an object
  #normalize(options) {
    if (typeof options === 'string') {
      return {
        url: options
      };
    }

    return options;
  }

  async request(subPath, method, body, signal) {
    let fetchOptions = {
      method,
      body,
      priority: 'high',
      signal
    };

    // stringify body if needed
    if (fetchOptions.body) {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
      fetchOptions.headers = {
        'Content-Type': 'application/json'
      };
    }

    let response = null;

    if (!this.isObservingObjectChanges()) {
      this.#observeObjectChanges();
    }

    try {
      response = await fetch(this.url + '/' + subPath, fetchOptions);
      const { status } = response;
      const json = await response.json();
      this.#handleResponseCode(status, json, fetchOptions);

      return json;
    } catch (error) {
      // abort errors are expected
      if (error.name === 'AbortError') {
        return;
      }

      // Network error, CouchDB unreachable.
      if (response === null) {
        this.indicator.setIndicatorToState(DISCONNECTED);
        console.error(error.message);

        throw new Error(`CouchDB Error - No response"`);
      } else {
        if (body?.model && isNotebookOrAnnotationType(body.model)) {
          // warn since we handle conflicts for notebooks
          console.warn(error.message);
        } else {
          console.error(error.message);
        }

        throw error;
      }
    }
  }

  /**
   * Handle the response code from a CouchDB request.
   * Sets the CouchDB indicator status and throws an error if needed.
   * @private
   */
  #handleResponseCode(status, json, fetchOptions) {
    this.indicator.setIndicatorToState(this.#statusCodeToIndicatorState(status));
    if (status === CouchObjectProvider.HTTP_CONFLICT) {
      const objectName = JSON.parse(fetchOptions.body)?.model?.name;
      throw new this.openmct.objects.errors.Conflict(`Conflict persisting "${objectName}"`);
    } else if (status >= CouchObjectProvider.HTTP_BAD_REQUEST) {
      if (!json.error || !json.reason) {
        throw new Error(`CouchDB Error ${status}`);
      }

      throw new Error(`CouchDB Error ${status}: "${json.error} - ${json.reason}"`);
    }
  }

  /**
   * Check the response to a create/update/delete request;
   * track the rev if it's valid, otherwise return false to
   * indicate that the request failed.
   * persist any queued objects
   * @private
   */
  #checkResponse(response, intermediateResponse, key) {
    let requestSuccess = false;
    const id = response ? response.id : undefined;
    let rev;

    if (response && response.ok) {
      rev = response.rev;
      requestSuccess = true;
    }

    intermediateResponse.resolve(requestSuccess);

    if (id) {
      if (!this.objectQueue[id]) {
        this.objectQueue[id] = new CouchObjectQueue(undefined, rev);
      }

      this.objectQueue[id].updateRevision(rev);
      this.objectQueue[id].pending = false;
      if (this.objectQueue[id].hasNext()) {
        this.#updateQueued(id);
      }
    } else {
      this.objectQueue[key].pending = false;
    }
  }

  /**
   * @private
   */
  #getModel(response) {
    if (response && response.model) {
      let key = response[ID];
      let object = this.fromPersistedModel(response.model, key);

      if (!this.objectQueue[key]) {
        this.objectQueue[key] = new CouchObjectQueue(undefined, response[REV]);
      }

      if (isNotebookOrAnnotationType(object)) {
        //Temporary measure until object sync is supported for all object types
        //Always update notebook revision number because we have realtime sync, so always assume it's the latest.
        this.objectQueue[key].updateRevision(response[REV]);
      } else if (!this.objectQueue[key].pending) {
        //Sometimes CouchDB returns the old rev which fetching the object if there is a document update in progress
        this.objectQueue[key].updateRevision(response[REV]);
      }

      return object;
    } else {
      return undefined;
    }
  }

  get(identifier, abortSignal) {
    this.batchIds.push(identifier.key);

    if (this.bulkPromise === undefined) {
      this.bulkPromise = this.#deferBatchedGet(abortSignal);
    }

    return this.bulkPromise.then((domainObjectMap) => {
      return domainObjectMap[identifier.key];
    });
  }

  /**
   * @private
   */
  #deferBatchedGet(abortSignal) {
    // We until the next event loop cycle to "collect" all of the get
    // requests triggered in this iteration of the event loop

    return this.#waitOneEventCycle().then(() => {
      let batchIds = this.batchIds;

      this.#clearBatch();

      if (batchIds.length === 1) {
        let objectKey = batchIds[0];

        //If there's only one request, just do a regular get
        return this.request(objectKey, 'GET', undefined, abortSignal).then(
          this.#returnAsMap(objectKey)
        );
      } else {
        return this.#bulkGet(batchIds, abortSignal);
      }
    });
  }

  /**
   * @private
   */
  #returnAsMap(objectKey) {
    return (result) => {
      let objectMap = {};
      objectMap[objectKey] = this.#getModel(result);

      return objectMap;
    };
  }

  /**
   * @private
   */
  #clearBatch() {
    this.batchIds = [];
    delete this.bulkPromise;
  }

  /**
   * @private
   */
  #waitOneEventCycle() {
    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  /**
   * @private
   */
  #bulkGet(ids, signal) {
    ids = this.removeDuplicates(ids);

    const query = {
      keys: ids
    };

    return this.request(ALL_DOCS, 'POST', query, signal).then((response) => {
      if (response && response.rows !== undefined) {
        return response.rows.reduce((map, row) => {
          //row.doc === null if the document does not exist.
          //row.doc === undefined if the document is not found.
          if (row.doc !== undefined) {
            map[row.key] = this.#getModel(row.doc);
          }

          return map;
        }, {});
      } else {
        return {};
      }
    });
  }

  /**
   * @private
   */
  removeDuplicates(array) {
    return Array.from(new Set(array));
  }

  search() {
    // Dummy search function. It has to appear to support search,
    // otherwise the in-memory indexer will index all of its objects,
    // but actually search results will be provided by a separate search provider
    // see CoucheSearchProvider.js
    return Promise.resolve([]);
  }

  async getObjectsByFilter(filter, abortSignal) {
    let objects = [];

    let url = `${this.url}/_find`;
    let body = {};

    if (filter) {
      body = JSON.stringify(filter);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: abortSignal,
      body
    });

    const reader = response.body.getReader();
    let completed = false;
    let decoder = new TextDecoder('utf-8');
    let decodedChunk = '';
    while (!completed) {
      const { done, value } = await reader.read();
      //done is true when we lose connection with the provider
      if (done) {
        completed = true;
      }

      if (value) {
        let chunk = new Uint8Array(value.length);
        chunk.set(value, 0);
        const partial = decoder.decode(chunk, { stream: !completed });
        decodedChunk = decodedChunk + partial;
      }
    }

    try {
      const json = JSON.parse(decodedChunk);
      if (json) {
        let docs = json.docs;
        docs.forEach((doc) => {
          let object = this.#getModel(doc);
          if (object) {
            objects.push(object);
          }
        });
      }
    } catch (e) {
      //do nothing
    }

    return objects;
  }

  observe(identifier, callback) {
    const keyString = this.openmct.objects.makeKeyString(identifier);
    this.observers[keyString] = this.observers[keyString] || [];
    this.observers[keyString].push(callback);

    if (!this.isObservingObjectChanges()) {
      this.#observeObjectChanges();
    }

    return () => {
      if (this.observers[keyString]) {
        this.observers[keyString] = this.observers[keyString].filter(
          (observer) => observer !== callback
        );
        if (this.observers[keyString].length === 0) {
          delete this.observers[keyString];
        }
      }
    };
  }

  isObservingObjectChanges() {
    return this.stopObservingObjectChanges !== undefined;
  }

  /**
   * @private
   */
  #observeObjectChanges() {
    const sseChangesPath = `${this.url}/_changes`;
    const sseURL = new URL(sseChangesPath);
    sseURL.searchParams.append('feed', 'eventsource');
    sseURL.searchParams.append('style', 'main_only');
    sseURL.searchParams.append('heartbeat', HEARTBEAT);

    if (typeof SharedWorker === 'undefined') {
      this.fetchChanges(sseURL.toString());
    } else {
      this.#initiateSharedWorkerFetchChanges(sseURL.toString());
    }
  }

  /**
   * @private
   */
  #initiateSharedWorkerFetchChanges(url) {
    if (!this.changesFeedSharedWorker) {
      this.changesFeedSharedWorker = this.#startSharedWorker();

      if (this.isObservingObjectChanges()) {
        this.stopObservingObjectChanges();
      }

      this.stopObservingObjectChanges = () => {
        delete this.stopObservingObjectChanges;
      };

      this.changesFeedSharedWorker.port.postMessage({
        request: 'changes',
        url
      });
    }
  }

  onEventError(error) {
    console.error('Error on feed', error);
    const { readyState } = error.target;
    this.#updateIndicatorStatus(readyState);
  }

  onEventOpen(event) {
    const { readyState } = event.target;
    this.#updateIndicatorStatus(readyState);
  }

  onEventMessage(event) {
    const { readyState } = event.target;
    const eventData = JSON.parse(event.data);
    const identifier = {
      namespace: this.namespace,
      key: eventData.id
    };
    const keyString = this.openmct.objects.makeKeyString(identifier);
    this.#updateIndicatorStatus(readyState);
    let observersForObject = this.observers[keyString];

    if (observersForObject) {
      observersForObject.forEach(async (observer) => {
        const updatedObject = await this.get(identifier);
        if (this.isSynchronizedObject(updatedObject)) {
          observer(updatedObject);
        }
      });
    }
  }

  fetchChanges(url) {
    const controller = new AbortController();
    let couchEventSource;

    if (this.isObservingObjectChanges()) {
      this.stopObservingObjectChanges();
    }

    this.stopObservingObjectChanges = () => {
      controller.abort();
      couchEventSource.removeEventListener('message', this.onEventMessage.bind(this));
      delete this.stopObservingObjectChanges;
    };

    console.debug('⇿ Opening CouchDB change feed connection ⇿');

    couchEventSource = new EventSource(url);
    couchEventSource.onerror = this.onEventError.bind(this);
    couchEventSource.onopen = this.onEventOpen.bind(this);

    // start listening for events
    couchEventSource.addEventListener('message', this.onEventMessage.bind(this));

    console.debug('⇿ Opened connection ⇿');
  }

  /**
   * @private
   */
  #getIntermediateResponse() {
    let intermediateResponse = {};
    intermediateResponse.promise = new Promise(function (resolve, reject) {
      intermediateResponse.resolve = resolve;
      intermediateResponse.reject = reject;
    });

    return intermediateResponse;
  }

  /**
   * Update the indicator status based on the readyState of the EventSource
   * @private
   */
  #updateIndicatorStatus(readyState) {
    let message;
    switch (readyState) {
      case EventSource.CONNECTING:
        message = 'pending';
        break;
      case EventSource.OPEN:
        message = 'open';
        break;
      case EventSource.CLOSED:
        message = 'close';
        break;
      default:
        message = 'unknown';
        break;
    }

    const indicatorState = this.#messageToIndicatorState(message);
    this.indicator.setIndicatorToState(indicatorState);
  }

  /**
   * @private
   */
  enqueueObject(key, model, intermediateResponse) {
    if (this.objectQueue[key]) {
      this.objectQueue[key].enqueue({
        model,
        intermediateResponse
      });
    } else {
      this.objectQueue[key] = new CouchObjectQueue({
        model,
        intermediateResponse
      });
    }
  }

  create(model) {
    let intermediateResponse = this.#getIntermediateResponse();
    const key = model.identifier.key;
    model = this.toPersistableModel(model);
    this.enqueueObject(key, model, intermediateResponse);

    if (!this.objectQueue[key].pending) {
      this.objectQueue[key].pending = true;
      const queued = this.objectQueue[key].dequeue();
      let couchDocument = new CouchDocument(key, queued.model);
      couchDocument.metadata.created = Date.now();
      this.#enqueueForPersistence({
        key,
        document: couchDocument
      })
        .then((response) => {
          this.#checkResponse(response, queued.intermediateResponse, key);
        })
        .catch((error) => {
          queued.intermediateResponse.reject(error);
          this.objectQueue[key].pending = false;
        });
    }

    return intermediateResponse.promise;
  }

  #enqueueForPersistence({ key, document }) {
    return new Promise((resolve, reject) => {
      this.persistenceQueue.push({
        key,
        document,
        resolve,
        reject
      });
      this.flushPersistenceQueue();
    });
  }

  async flushPersistenceQueue() {
    if (this.persistenceQueue.length > 1) {
      const batch = {
        docs: this.persistenceQueue.map((queued) => queued.document)
      };
      const response = await this.request('_bulk_docs', 'POST', batch);
      response.forEach((responseMetadatum) => {
        const queued = this.persistenceQueue.find(
          (queuedMetadatum) => queuedMetadatum.key === responseMetadatum.id
        );
        if (responseMetadatum.ok) {
          queued.resolve(responseMetadatum);
        } else {
          queued.reject(responseMetadatum);
        }
      });
    } else if (this.persistenceQueue.length === 1) {
      const { key, document, resolve, reject } = this.persistenceQueue[0];

      this.request(key, 'PUT', document).then(resolve).catch(reject);
    }
    this.persistenceQueue = [];
  }

  /**
   * @private
   */
  #updateQueued(key) {
    if (!this.objectQueue[key].pending) {
      this.objectQueue[key].pending = true;
      const queued = this.objectQueue[key].dequeue();
      let document = new CouchDocument(key, queued.model, this.objectQueue[key].rev);
      this.request(key, 'PUT', document)
        .then((response) => {
          this.#checkResponse(response, queued.intermediateResponse, key);
        })
        .catch((error) => {
          queued.intermediateResponse.reject(error);
          this.objectQueue[key].pending = false;
        });
    }
  }

  update(model) {
    let intermediateResponse = this.#getIntermediateResponse();
    const key = model.identifier.key;
    model = this.toPersistableModel(model);

    this.enqueueObject(key, model, intermediateResponse);
    this.#updateQueued(key);

    return intermediateResponse.promise;
  }

  toPersistableModel(model) {
    //First make a copy so we are not mutating the provided model.
    const persistableModel = JSON.parse(JSON.stringify(model));
    //Delete the identifier. Couch manages namespaces dynamically.
    delete persistableModel.identifier;

    return persistableModel;
  }

  fromPersistedModel(model, key) {
    model.identifier = {
      namespace: this.namespace,
      key
    };

    return model;
  }
}

// https://docs.couchdb.org/en/3.2.0/api/basics.html
CouchObjectProvider.HTTP_OK = 200;
CouchObjectProvider.HTTP_CREATED = 201;
CouchObjectProvider.HTTP_ACCEPTED = 202;
CouchObjectProvider.HTTP_NOT_MODIFIED = 304;
CouchObjectProvider.HTTP_BAD_REQUEST = 400;
CouchObjectProvider.HTTP_UNAUTHORIZED = 401;
CouchObjectProvider.HTTP_FORBIDDEN = 403;
CouchObjectProvider.HTTP_NOT_FOUND = 404;
CouchObjectProvider.HTTP_METHOD_NOT_ALLOWED = 404;
CouchObjectProvider.HTTP_NOT_ACCEPTABLE = 406;
CouchObjectProvider.HTTP_CONFLICT = 409;
CouchObjectProvider.HTTP_PRECONDITION_FAILED = 412;
CouchObjectProvider.HTTP_REQUEST_ENTITY_TOO_LARGE = 413;
CouchObjectProvider.HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
CouchObjectProvider.HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
CouchObjectProvider.HTTP_EXPECTATION_FAILED = 417;
CouchObjectProvider.HTTP_SERVER_ERROR = 500;
// If CouchDB is containerized via Docker it will return 503 if service is unavailable.
CouchObjectProvider.HTTP_SERVICE_UNAVAILABLE = 503;

export default CouchObjectProvider;
