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

import RootRegistry from './RootRegistry';

class InMemorySearchProvider {
    /**
     * A search service which searches through domain objects in
     * the filetree without using external search implementations.
     *
     * @constructor
     * @param {ObjectService} objectService the object service.
     */
    constructor(openmct) {
        /**
         * Maximum number of concurrent index requests to allow.
         */
        this.MAX_CONCURRENT_REQUESTS = 100;

        this.openmct = openmct;

        this.indexedIds = {};
        this.idsToIndex = [];
        this.pendingIndex = {};
        this.pendingRequests = 0;

        this.pendingQueries = {};

        openmct.on('start', this.startIndexing());
        /*
        ROOTS.forEach(function indexRoot(rootId) {
            provider.scheduleForIndexing(rootId);
        }); */

    }

    startIndexing() {
        this.worker = this.startSharedWorker();
    }

    /**
     * Query the search provider for results.
     *
     * @param {String} input the string to search by.
     * @param {Number} maxResults max number of results to return.
     * @returns {Promise} a promise for a modelResults object.
     */
    query(input, maxResults) {
        const queryId = this.dispatchSearch(input, maxResults);
        const pendingQuery = this.$q.defer();

        this.pendingQueries[queryId] = pendingQuery;

        return pendingQuery.promise;
    }

    /**
     * Handle messages from the worker.  Only really knows how to handle search
     * results, which are parsed, transformed into a modelResult object, which
     * is used to resolve the corresponding promise.
     * @private
     */
    onWorkerMessage(event) {
        if (event.data.request !== 'search') {
            return;
        }

        let pendingQuery;
        let modelResults;

        if (this.USE_LEGACY_INDEXER) {
            pendingQuery = this.pendingQueries[event.data.queryId];
            modelResults = {
                total: event.data.total
            };

            modelResults.hits = event.data.results.map(function (hit) {
                return {
                    id: hit.item.id,
                    model: hit.item.model,
                    type: hit.item.type,
                    score: hit.matchCount
                };
            });
        } else {
            pendingQuery = this.pendingQueries[event.data.queryId];
            modelResults = {
                total: event.data.total
            };

            modelResults.hits = event.data.results.map(function (hit) {
                return {
                    id: hit.id
                };
            });
        }

        pendingQuery.resolve(modelResults);
        delete this.pendingQueries[event.data.queryId];
    }

    /**
     * Handle errors from the worker.
     * @private
     */
    onWorkerMessageError(event) {
        console.error('⚙️ Error with InMemorySearch worker', event);
    }

    /**
     * @private
     */
    startSharedWorker() {
        const provider = this;
        let sharedWorker;

        // eslint-disable-next-line no-undef
        const sharedWorkerURL = `${this.openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}InMemorySearchWorker.js`;

        sharedWorker = new SharedWorker(sharedWorkerURL);
        sharedWorker.port.onmessage = provider.onWorkerMessage.bind(this);
        sharedWorker.port.onmessageerror = provider.onWorkerMessageError.bind(this);
        sharedWorker.port.start();

        return sharedWorker;
    }

    /**
     * Listen to the mutation topic and re-index objects when they are
     * mutated.
     *
     * @private
     * @param topic the topicService.
     */
    indexOnMutation(topic) {
        let mutationTopic = topic('mutation');

        mutationTopic.listen(mutatedObject => {
            let editor = mutatedObject.getCapability('editor');
            if (!editor || !editor.inEditContext()) {
                this.index(
                    mutatedObject.getId(),
                    mutatedObject.getModel()
                );
            }
        });
    }

    /**
     * Schedule an id to be indexed at a later date.  If there are less
     * pending requests then allowed, will kick off an indexing request.
     *
     * @private
     * @param {String} id to be indexed.
     */
    scheduleForIndexing(id) {
        const identifier = this.openmct.objects.parseKeyString(id);
        const objectProvider = this.openmct.objects.getProvider(identifier);

        if (objectProvider === undefined || objectProvider.search === undefined) {
            if (!this.indexedIds[id] && !this.pendingIndex[id]) {
                this.indexedIds[id] = true;
                this.pendingIndex[id] = true;
                this.idsToIndex.push(id);
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

    /**
     * Pass an id and model to the worker to be indexed.  If the model has
     * composition, schedule those ids for later indexing.
     *
     * @private
     * @param id a model id
     * @param model a model
     */
    async index(id, model) {
        const provider = this;

        if (id !== 'ROOT') {
            this.worker.postMessage({
                request: 'index',
                model: model,
                id: id
            });
        }

        let domainObject = this.openmct.objects.toNewFormat(model, id);
        let composition = this.openmct.composition.registry.find(p => {
            return p.appliesTo(domainObject);
        });

        if (!composition) {
            return;
        }

        const children = await composition.load(domainObject);
        children.forEach(function (child) {
            provider.scheduleForIndexing(provider.openmct.objects.makeKeyString(child));
        });
    }

    /**
     * Pulls an id from the indexing queue, loads it from the model service,
     * and indexes it.  Upon completion, tells the provider to keep
     * indexing.
     *
     * @private
     */
    async beginIndexRequest() {
        const idToIndex = this.idsToIndex.shift();
        const provider = this;

        this.pendingRequests += 1;
        const object = await this.openmct.objects.get(idToIndex);
        delete provider.pendingIndex[idToIndex];
        try {
            if (object) {
                await provider.index(idToIndex, object.model);
            }
        } catch (error) {
            console.warn('Failed to index domain object ' + idToIndex, error);
        }

        setTimeout(function () {
            provider.pendingRequests -= 1;
            provider.keepIndexing();
        }, 0);
    }

    /**
     * @private
     * @returns {Number} a unique, unused query Id.
     */
    makeQueryId() {
        let queryId = Math.ceil(Math.random() * 100000);
        while (this.pendingQueries[queryId]) {
            queryId = Math.ceil(Math.random() * 100000);
        }

        return queryId;
    }

    /**
     * Dispatch a search query to the worker and return a queryId.
     *
     * @private
     * @returns {Number} a unique query Id for the query.
     */
    dispatchSearch(searchInput, maxResults) {
        const queryId = this.makeQueryId();

        this.worker.postMessage({
            request: 'search',
            input: searchInput,
            maxResults: maxResults,
            queryId: queryId
        });

        return queryId;
    }
}

export default InMemorySearchProvider;
