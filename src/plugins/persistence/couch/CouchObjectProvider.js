/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

import CouchDocument from "./CouchDocument";
import CouchObjectQueue from "./CouchObjectQueue";
import { PENDING, CONNECTED, DISCONNECTED } from "./CouchStatusIndicator";
import { isNotebookType } from '../../notebook/notebook-constants.js';

const REV = "_rev";
const ID = "_id";
const HEARTBEAT = 50000;
const ALL_DOCS = "_all_docs?include_docs=true";

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
        console.log('Error', event);
    }

    isSynchronizedObject(object) {
        return (object && object.type
            && this.openmct.objects.SYNCHRONIZED_OBJECT_TYPES
            && this.openmct.objects.SYNCHRONIZED_OBJECT_TYPES.includes(object.type));

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

            if (observersForObject) {
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
     * @returns import('./CouchStatusIndicator').IndicatorState
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
        default:
            state = PENDING;
            break;
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
            signal
        };

        // stringify body if needed
        if (fetchOptions.body) {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
            fetchOptions.headers = {
                "Content-Type": "application/json"
            };
        }

        let response = null;
        try {
            response = await fetch(this.url + '/' + subPath, fetchOptions);
            this.indicator.setIndicatorToState(CONNECTED);

            if (response.status === CouchObjectProvider.HTTP_CONFLICT) {
                throw new this.openmct.objects.errors.Conflict(`Conflict persisting ${fetchOptions.body.name}`);
            } else if (response.status === CouchObjectProvider.HTTP_BAD_REQUEST
                || response.status === CouchObjectProvider.HTTP_UNAUTHORIZED
                || response.status === CouchObjectProvider.HTTP_NOT_FOUND
                || response.status === CouchObjectProvider.HTTP_PRECONDITION_FAILED) {
                const error = await response.json();
                throw new Error(`CouchDB Error: "${error.error}: ${error.reason}"`);
            } else if (response.status === CouchObjectProvider.HTTP_SERVER_ERROR) {
                throw new Error('CouchDB Error: "500 Internal Server Error"');
            }

            return await response.json();
        } catch (error) {
            // Network error, CouchDB unreachable.
            if (response === null) {
                this.indicator.setIndicatorToState(DISCONNECTED);
            }

            console.error(error.message);
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

            if (isNotebookType(object)) {
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

        return this.bulkPromise
            .then((domainObjectMap) => {
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
                return this.request(objectKey, "GET", undefined, abortSignal)
                    .then(this.#returnAsMap(objectKey));
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
            'keys': ids
        };

        return this.request(ALL_DOCS, 'POST', query, signal).then((response) => {
            if (response && response.rows !== undefined) {
                return response.rows.reduce((map, row) => {
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
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: abortSignal,
            body
        });

        const reader = response.body.getReader();
        let completed = false;
        let decoder = new TextDecoder("utf-8");
        let decodedChunk = '';
        while (!completed) {
            const {done, value} = await reader.read();
            //done is true when we lose connection with the provider
            if (done) {
                completed = true;
            }

            if (value) {
                let chunk = new Uint8Array(value.length);
                chunk.set(value, 0);
                const partial = decoder.decode(chunk, {stream: !completed});
                decodedChunk = decodedChunk + partial;
            }
        }

        try {
            const json = JSON.parse(decodedChunk);
            if (json) {
                let docs = json.docs;
                docs.forEach(doc => {
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
                this.observers[keyString] = this.observers[keyString].filter(observer => observer !== callback);
                if (this.observers[keyString].length === 0) {
                    delete this.observers[keyString];
                    if (Object.keys(this.observers).length === 0 && this.isObservingObjectChanges()) {
                        this.stopObservingObjectChanges();
                    }
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
        if (Object.keys(this.observers).length > 0) {
            this.#observeObjectChanges();
        }
    }

    onEventMessage(event) {
        const eventData = JSON.parse(event.data);
        const identifier = {
            namespace: this.namespace,
            key: eventData.id
        };
        const keyString = this.openmct.objects.makeKeyString(identifier);
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
            couchEventSource.removeEventListener('message', this.onEventMessage);
            delete this.stopObservingObjectChanges;
        };

        console.debug('⇿ Opening CouchDB change feed connection ⇿');

        couchEventSource = new EventSource(url);
        couchEventSource.onerror = this.onEventError;

        // start listening for events
        couchEventSource.addEventListener('message', this.onEventMessage);

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
            let document = new CouchDocument(key, queued.model);
            this.request(key, "PUT", document).then((response) => {
                console.log('create check response', key);
                this.#checkResponse(response, queued.intermediateResponse, key);
            }).catch(error => {
                queued.intermediateResponse.reject(error);
                this.objectQueue[key].pending = false;
            });
        }

        return intermediateResponse.promise;
    }

    /**
     * @private
     */
    #updateQueued(key) {
        if (!this.objectQueue[key].pending) {
            this.objectQueue[key].pending = true;
            const queued = this.objectQueue[key].dequeue();
            let document = new CouchDocument(key, queued.model, this.objectQueue[key].rev);
            this.request(key, "PUT", document).then((response) => {
                this.#checkResponse(response, queued.intermediateResponse, key);
            }).catch((error) => {
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

CouchObjectProvider.HTTP_BAD_REQUEST = 400;
CouchObjectProvider.HTTP_UNAUTHORIZED = 401;
CouchObjectProvider.HTTP_NOT_FOUND = 404;
CouchObjectProvider.HTTP_CONFLICT = 409;
CouchObjectProvider.HTTP_PRECONDITION_FAILED = 412;
CouchObjectProvider.HTTP_SERVER_ERROR = 500;

export default CouchObjectProvider;
