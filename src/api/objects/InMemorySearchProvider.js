/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import uuid from 'uuid';

class InMemorySearchProvider {
    /**
     * A search service which searches through domain objects in
     * the filetree without using external search implementations.
     *
     * @constructor
     * @param {Object} openmct
     */
    constructor(openmct) {
        /**
         * Maximum number of concurrent index requests to allow.
         */
        this.MAX_CONCURRENT_REQUESTS = 100;
        /**
        * If max results is not specified in query, use this as default.
        */
        this.DEFAULT_MAX_RESULTS = 100;

        this.openmct = openmct;

        this.indexedIds = {};
        this.idsToIndex = [];
        this.pendingIndex = {};
        this.pendingRequests = 0;

        this.pendingQueries = {};
        this.onWorkerMessage = this.onWorkerMessage.bind(this);
        this.onWorkerMessageError = this.onWorkerMessageError.bind(this);
        this.onerror = this.onWorkerError.bind(this);
        this.startIndexing = this.startIndexing.bind(this);
        this.onMutationOfIndexedObject = this.onMutationOfIndexedObject.bind(this);

        openmct.on('start', this.startIndexing);
    }

    startIndexing() {
        console.debug('🖲 Starting indexing for search 🖲');
        // Need to check here if object provider supports search or not
        const rootObject = this.openmct.objects.rootProvider.rootObject;
        this.scheduleForIndexing(rootObject.identifier);
        this.worker = this.startSharedWorker();
    }

    /**
     * @private
     */
    getIntermediateResponse() {
        let intermediateResponse = {};
        intermediateResponse.promise = new Promise(function (resolve, reject) {
            intermediateResponse.resolve = resolve;
            intermediateResponse.reject = reject;
        });

        return intermediateResponse;
    }

    /**
     * Query the search provider for results.
     *
     * @param {String} input the string to search by.
     * @param {Number} maxResults max number of results to return.
     * @returns {Promise} a promise for a modelResults object.
     */
    query(input, maxResults) {
        if (!maxResults) {
            maxResults = this.DEFAULT_MAX_RESULTS;
        }

        const queryId = this.dispatchSearch(input, maxResults);
        const pendingQuery = this.getIntermediateResponse();
        this.pendingQueries[queryId] = pendingQuery;

        return pendingQuery.promise;
    }

    /**
     * Handle messages from the worker.  Only really knows how to handle search
     * results, which are parsed, transformed into a modelResult object, which
     * is used to resolve the corresponding promise.
     * @private
     */
    async onWorkerMessage(event) {
        console.debug(`🖲 Received event from search worker 🖲`, event);
        if (event.data.request !== 'search') {
            return;
        }

        const pendingQuery = this.pendingQueries[event.data.queryId];
        const modelResults = {
            total: event.data.total
        };
        modelResults.hits = await Promise.all(event.data.results.map(async (hit) => {
            const identifier = this.openmct.objects.parseKeyString(hit.keyString);
            const domainObject = await this.openmct.objects.get(identifier.key);

            return domainObject;
        }));

        pendingQuery.resolve(modelResults);
        console.debug(`🖲 Returning model results 🖲`, modelResults);
        delete this.pendingQueries[event.data.queryId];
    }

    /**
     * Handle error messages from the worker.
     * @private
     */
    onWorkerMessageError(event) {
        console.error('⚙️ Error message from InMemorySearch worker ⚙️', event);
    }

    /**
     * Handle errors from the worker.
     * @private
     */
    onWorkerError(event) {
        console.error('⚙️ Error with InMemorySearch worker ⚙️', event);
    }

    /**
     * @private
     */
    startSharedWorker() {
        // eslint-disable-next-line no-undef
        const sharedWorkerURL = `${this.openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}inMemorySearchWorker.js`;

        const sharedWorker = new SharedWorker(sharedWorkerURL, 'InMemorySearch Shared Worker');
        sharedWorker.onerror = this.onWorkerError;
        sharedWorker.port.onmessage = this.onWorkerMessage;
        sharedWorker.port.onmessageerror = this.onWorkerMessageError;
        sharedWorker.port.start();

        return sharedWorker;
    }

    /**
     * Schedule an id to be indexed at a later date.  If there are less
     * pending requests then allowed, will kick off an indexing request.
     *
     * @private
     * @param {identifier} id to be indexed.
     */
    scheduleForIndexing(identifier) {
        const keyString = this.openmct.objects.makeKeyString(identifier);
        const objectProvider = this.openmct.objects.getProvider(identifier.key);

        if (objectProvider === undefined || objectProvider.search === undefined) {
            if (!this.indexedIds[keyString] && !this.pendingIndex[keyString]) {
                this.indexedIds[keyString] = true;
                this.pendingIndex[keyString] = true;
                this.idsToIndex.push(keyString);
            }
        }

        this.keepIndexing();
    }

    /**
     * If there are less pending requests than concurrent requests, keep
     * firing requests.
     *
     * @private
     */
    keepIndexing() {
        while (this.pendingRequests < this.MAX_CONCURRENT_REQUESTS
            && this.idsToIndex.length
        ) {
            this.beginIndexRequest();
        }
    }

    onMutationOfIndexedObject(domainObject) {
        const provider = this;
        provider.index(domainObject.identifier, domainObject);
    }

    /**
     * Pass an id and model to the worker to be indexed.  If the model has
     * composition, schedule those ids for later indexing.
     *
     * @private
     * @param id a model id
     * @param model a model
     */
    async index(id, domainObject) {
        const provider = this;
        const keyString = this.openmct.objects.makeKeyString(id);
        console.debug(`🖲 Telling worker to index ${keyString} 🖲`, domainObject);

        if ((id.key !== 'ROOT') && (id.key !== 'mine')) {
            this.worker.port.postMessage({
                request: 'index',
                model: domainObject,
                keyString
            });
            this.openmct.objects.observe(domainObject, `*`, this.onMutationOfIndexedObject);
        }

        const composition = this.openmct.composition.registry.find(foundComposition => {
            return foundComposition.appliesTo(domainObject);
        });

        if (composition) {
            const childIdentifiers = await composition.load(domainObject);
            childIdentifiers.forEach(function (childIdentifier) {
                provider.scheduleForIndexing(childIdentifier);
            });
        }
    }

    /**
     * Pulls an id from the indexing queue, loads it from the model service,
     * and indexes it.  Upon completion, tells the provider to keep
     * indexing.
     *
     * @private
     */
    async beginIndexRequest() {
        const keyString = this.idsToIndex.shift();
        const provider = this;

        this.pendingRequests += 1;
        const identifier = await this.openmct.objects.parseKeyString(keyString);
        const domainObject = await this.openmct.objects.get(identifier.key);
        delete provider.pendingIndex[keyString];
        try {
            if (domainObject) {
                await provider.index(identifier, domainObject);
            }
        } catch (error) {
            console.warn('Failed to index domain object ' + keyString, error);
        }

        setTimeout(function () {
            provider.pendingRequests -= 1;
            provider.keepIndexing();
        }, 0);
    }

    /**
     * Dispatch a search query to the worker and return a queryId.
     *
     * @private
     * @returns {String} a unique query Id for the query.
     */
    dispatchSearch(searchInput, maxResults) {
        const queryId = uuid();
        console.debug(`🍉 Sending to worker to search 🍉`, searchInput);

        this.worker.port.postMessage({
            request: 'search',
            input: searchInput,
            maxResults: maxResults,
            queryId: queryId
        });

        return queryId;
    }
}

export default InMemorySearchProvider;
