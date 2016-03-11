/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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
/*global define,setTimeout*/

/**
 * Module defining GenericSearchProvider. Created by shale on 07/16/2015.
 */
define([

], function (

) {
    "use strict";

    /**
     * A search service which searches through domain objects in
     * the filetree without using external search implementations.
     *
     * @constructor
     * @param $q Angular's $q, for promise consolidation.
     * @param $log Anglar's $log, for logging.
     * @param {ModelService} modelService the model service.
     * @param {WorkerService} workerService the workerService.
     * @param {TopicService} topic the topic service.
     * @param {Array} ROOTS An array of object Ids to begin indexing.
     */
    function GenericSearchProvider($q, $log, modelService, workerService, topic, ROOTS) {
        var provider = this;
        this.$q = $q;
        this.$log = $log;
        this.modelService = modelService;

        this.indexedIds = {};
        this.idsToIndex = [];
        this.pendingIndex = {};
        this.pendingRequests = 0;

        this.pendingQueries = {};

        this.worker = this.startWorker(workerService);
        this.indexOnMutation(topic);

        ROOTS.forEach(function indexRoot(rootId) {
            provider.scheduleForIndexing(rootId);
        });


    }

    /**
     * Maximum number of concurrent index requests to allow.
     */
    GenericSearchProvider.prototype.MAX_CONCURRENT_REQUESTS = 100;

    /**
     * Query the search provider for results.
     *
     * @param {String} input the string to search by.
     * @param {Number} maxResults max number of results to return.
     * @returns {Promise} a promise for a modelResults object.
     */
    GenericSearchProvider.prototype.query = function (
        input,
        maxResults
    ) {

        var queryId = this.dispatchSearch(input, maxResults),
            pendingQuery = this.$q.defer();

        this.pendingQueries[queryId] = pendingQuery;

        return pendingQuery.promise;
    };

    /**
     * Creates a search worker and attaches handlers.
     *
     * @private
     * @param workerService
     * @returns worker the created search worker.
     */
    GenericSearchProvider.prototype.startWorker = function (workerService) {
        var worker = workerService.run('genericSearchWorker'),
            provider = this;

        worker.addEventListener('message', function (messageEvent) {
            provider.onWorkerMessage(messageEvent);
        });

        return worker;
    };

    /**
     * Listen to the mutation topic and re-index objects when they are
     * mutated.
     *
     * @private
     * @param topic the topicService.
     */
    GenericSearchProvider.prototype.indexOnMutation = function (topic) {
        var mutationTopic = topic('mutation'),
            provider = this;

        mutationTopic.listen(function (mutatedObject) {
            var status = mutatedObject.getCapability('status');
            if (!status || !status.get('editing')) {
                provider.index(
                    mutatedObject.getId(),
                    mutatedObject.getModel()
                );
            }
        });
    };

    /**
     * Schedule an id to be indexed at a later date.  If there are less
     * pending requests then allowed, will kick off an indexing request.
     *
     * @private
     * @param {String} id to be indexed.
     */
    GenericSearchProvider.prototype.scheduleForIndexing = function (id) {
        if (!this.indexedIds[id] && !this.pendingIndex[id]) {
            this.indexedIds[id] = true;
            this.pendingIndex[id] = true;
            this.idsToIndex.push(id);
        }
        this.keepIndexing();
    };

    /**
     * If there are less pending requests than concurrent requests, keep
     * firing requests.
     *
     * @private
     */
    GenericSearchProvider.prototype.keepIndexing = function () {
        while (this.pendingRequests < this.MAX_CONCURRENT_REQUESTS &&
            this.idsToIndex.length
            ) {
            this.beginIndexRequest();
        }
    };

    /**
     * Pass an id and model to the worker to be indexed.  If the model has
     * composition, schedule those ids for later indexing.
     *
     * @private
     * @param id a model id
     * @param model a model
     */
    GenericSearchProvider.prototype.index = function (id, model) {
        var provider = this;

        this.worker.postMessage({
            request: 'index',
            model: model,
            id: id
        });

        if (Array.isArray(model.composition)) {
            model.composition.forEach(function (id) {
                provider.scheduleForIndexing(id);
            });
        }
    };

    /**
     * Pulls an id from the indexing queue, loads it from the model service,
     * and indexes it.  Upon completion, tells the provider to keep
     * indexing.
     *
     * @private
     */
    GenericSearchProvider.prototype.beginIndexRequest = function () {
        var idToIndex = this.idsToIndex.shift(),
            provider = this;

        this.pendingRequests += 1;
        this.modelService
            .getModels([idToIndex])
            .then(function (models) {
                delete provider.pendingIndex[idToIndex];
                if (models[idToIndex]) {
                    provider.index(idToIndex, models[idToIndex]);
                }
            }, function () {
                provider
                    .$log
                    .warn('Failed to index domain object ' + idToIndex);
            })
            .then(function () {
                setTimeout(function () {
                    provider.pendingRequests -= 1;
                    provider.keepIndexing();
                }, 0);
            });
    };

    /**
     * Handle messages from the worker.  Only really knows how to handle search
     * results, which are parsed, transformed into a modelResult object, which
     * is used to resolve the corresponding promise.
     * @private
     */
    GenericSearchProvider.prototype.onWorkerMessage = function (event) {
        if (event.data.request !== 'search') {
            return;
        }

        var pendingQuery = this.pendingQueries[event.data.queryId],
            modelResults = {
                total: event.data.total
            };

        modelResults.hits = event.data.results.map(function (hit) {
            return {
                id: hit.item.id,
                model: hit.item.model,
                score: hit.matchCount
            };
        });

        pendingQuery.resolve(modelResults);
        delete this.pendingQueries[event.data.queryId];
    };

    /**
     * @private
     * @returns {Number} a unique, unusued query Id.
     */
    GenericSearchProvider.prototype.makeQueryId = function () {
        var queryId = Math.ceil(Math.random() * 100000);
        while (this.pendingQueries[queryId]) {
            queryId = Math.ceil(Math.random() * 100000);
        }
        return queryId;
    };

    /**
     * Dispatch a search query to the worker and return a queryId.
     *
     * @private
     * @returns {Number} a unique query Id for the query.
     */
    GenericSearchProvider.prototype.dispatchSearch = function (
        searchInput,
        maxResults
    ) {
        var queryId = this.makeQueryId();

        this.worker.postMessage({
            request: 'search',
            input: searchInput,
            maxResults: maxResults,
            queryId: queryId
        });

        return queryId;
    };


    return GenericSearchProvider;
});
