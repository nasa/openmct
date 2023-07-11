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

import { v4 as uuid } from 'uuid';

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
    this.indexedCompositions = {};
    this.idsToIndex = [];
    this.pendingIndex = {};
    this.pendingRequests = 0;
    this.worker = null;

    /**
     * If we don't have SharedWorkers available (e.g., iOS)
     */
    this.localIndexedDomainObjects = {};
    this.localIndexedAnnotationsByDomainObject = {};
    this.localIndexedAnnotationsByTag = {};

    this.pendingQueries = {};
    this.onWorkerMessage = this.onWorkerMessage.bind(this);
    this.onWorkerMessageError = this.onWorkerMessageError.bind(this);
    this.localSearchForObjects = this.localSearchForObjects.bind(this);
    this.localSearchForAnnotations = this.localSearchForAnnotations.bind(this);
    this.localSearchForTags = this.localSearchForTags.bind(this);
    this.onAnnotationCreation = this.onAnnotationCreation.bind(this);
    this.onCompositionAdded = this.onCompositionAdded.bind(this);
    this.onCompositionRemoved = this.onCompositionRemoved.bind(this);
    this.onerror = this.onWorkerError.bind(this);
    this.startIndexing = this.startIndexing.bind(this);

    this.openmct.on('start', this.startIndexing);
    this.openmct.on('destroy', () => {
      if (this.worker && this.worker.port) {
        this.worker.onerror = null;
        this.worker.port.onmessage = null;
        this.worker.port.onmessageerror = null;
        this.worker.port.close();
      }

      Object.keys(this.indexedCompositions).forEach((keyString) => {
        const composition = this.indexedCompositions[keyString];
        composition.off('add', this.onCompositionAdded);
        composition.off('remove', this.onCompositionRemoved);
      });

      this.destroyObservers(this.indexedIds);
      this.destroyObservers(this.indexedCompositions);
    });
  }

  startIndexing() {
    const rootObject = this.openmct.objects.rootProvider.rootObject;

    this.searchTypes = this.openmct.objects.SEARCH_TYPES;

    this.supportedSearchTypes = [
      this.searchTypes.OBJECTS,
      this.searchTypes.ANNOTATIONS,
      this.searchTypes.TAGS
    ];

    this.scheduleForIndexing(rootObject.identifier);

    this.indexAnnotations();

    if (typeof SharedWorker !== 'undefined') {
      this.worker = this.startSharedWorker();
    } else {
      // we must be on iOS
    }

    this.openmct.annotation.on('annotationCreated', this.onAnnotationCreation);
  }

  indexAnnotations() {
    const theInMemorySearchProvider = this;
    Object.values(this.openmct.objects.providers).forEach((objectProvider) => {
      if (objectProvider.getAllObjects) {
        const allObjects = objectProvider.getAllObjects();
        if (allObjects) {
          Object.values(allObjects).forEach((domainObject) => {
            if (domainObject.type === 'annotation') {
              theInMemorySearchProvider.scheduleForIndexing(domainObject.identifier);
            }
          });
        }
      }
    });
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

  search(query, searchType) {
    const queryId = uuid();
    const pendingQuery = this.getIntermediateResponse();
    this.pendingQueries[queryId] = pendingQuery;
    const searchOptions = {
      queryId,
      searchType,
      query,
      maxResults: this.DEFAULT_MAX_RESULTS
    };

    if (this.worker) {
      this.#dispatchSearchToWorker(searchOptions);
    } else {
      this.#localQueryFallBack(searchOptions);
    }

    return pendingQuery.promise;
  }

  #localQueryFallBack({ queryId, searchType, query, maxResults }) {
    if (searchType === this.searchTypes.OBJECTS) {
      return this.localSearchForObjects(queryId, query, maxResults);
    } else if (searchType === this.searchTypes.ANNOTATIONS) {
      return this.localSearchForAnnotations(queryId, query, maxResults);
    } else if (searchType === this.searchTypes.TAGS) {
      return this.localSearchForTags(queryId, query, maxResults);
    } else {
      throw new Error(`🤷‍♂️ Unknown search type passed: ${searchType}`);
    }
  }

  supportsSearchType(searchType) {
    return this.supportedSearchTypes.includes(searchType);
  }

  /**
   * Handle messages from the worker.
   * @private
   */
  async onWorkerMessage(event) {
    const pendingQuery = this.pendingQueries[event.data.queryId];
    const modelResults = {
      total: event.data.total
    };
    modelResults.hits = await Promise.all(
      event.data.results.map(async (hit) => {
        if (hit && hit.keyString) {
          const identifier = this.openmct.objects.parseKeyString(hit.keyString);
          const domainObject = await this.openmct.objects.get(identifier);

          return domainObject;
        }
      })
    );

    pendingQuery.resolve(modelResults);
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
   * pending requests than the maximum allowed, this will kick off an indexing request.
   * This is done only when indexing first begins and we need to index a lot of objects.
   *
   * @private
   * @param {identifier} id to be indexed.
   */
  scheduleForIndexing(identifier) {
    const keyString = this.openmct.objects.makeKeyString(identifier);
    const objectProvider = this.openmct.objects.getProvider(identifier);

    if (objectProvider === undefined || objectProvider.search === undefined) {
      if (!this.indexedIds[keyString] && !this.pendingIndex[keyString]) {
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
    while (this.pendingRequests < this.MAX_CONCURRENT_REQUESTS && this.idsToIndex.length) {
      this.beginIndexRequest();
    }
  }

  onAnnotationCreation(annotationObject) {
    const objectProvider = this.openmct.objects.getProvider(annotationObject.identifier);
    if (objectProvider === undefined || objectProvider.search === undefined) {
      const provider = this;
      provider.index(annotationObject);
    }
  }

  onNameMutation(domainObject, name) {
    const provider = this;

    domainObject.name = name;
    provider.index(domainObject);
  }

  onCompositionAdded(newDomainObjectToIndex) {
    const provider = this;
    // The object comes in as a mutable domain object, which has functions,
    // which the index function cannot handle as it will eventually be serialized
    // using structuredClone. Thus we're using JSON.parse/JSON.stringify to discard
    // those functions.
    const nonMutableDomainObject = JSON.parse(JSON.stringify(newDomainObjectToIndex));

    const objectProvider = this.openmct.objects.getProvider(nonMutableDomainObject.identifier);
    if (objectProvider === undefined || objectProvider.search === undefined) {
      provider.index(nonMutableDomainObject);
    }
  }

  onCompositionRemoved(domainObjectToRemoveIdentifier) {
    const keyString = this.openmct.objects.makeKeyString(domainObjectToRemoveIdentifier);
    if (this.indexedIds[keyString]) {
      // we store the unobserve function in the indexedId map
      this.indexedIds[keyString]();
      delete this.indexedIds[keyString];
    }

    const composition = this.indexedCompositions[keyString];
    if (composition) {
      composition.off('add', this.onCompositionAdded);
      composition.off('remove', this.onCompositionRemoved);
      delete this.indexedCompositions[keyString];
    }
  }

  /**
   * Pass a domainObject to the worker to be indexed.
   * If the object has composition, schedule those ids for later indexing.
   * Watch for object changes and re-index object and children if so
   *
   * @private
   * @param domainObject a domainObject
   */
  async index(domainObject) {
    const provider = this;
    const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
    const composition = this.openmct.composition.get(domainObject);

    if (!this.indexedIds[keyString]) {
      this.indexedIds[keyString] = this.openmct.objects.observe(
        domainObject,
        'name',
        this.onNameMutation.bind(this, domainObject)
      );
      if (composition) {
        composition.on('add', this.onCompositionAdded);
        composition.on('remove', this.onCompositionRemoved);
        this.indexedCompositions[keyString] = composition;
      }
    }

    if (keyString !== 'ROOT') {
      if (this.worker) {
        this.worker.port.postMessage({
          request: 'index',
          model: domainObject,
          keyString
        });
      } else {
        this.localIndexItem(keyString, domainObject);
      }
    }

    if (composition !== undefined) {
      const children = await composition.load();

      children.forEach((child) => provider.scheduleForIndexing(child.identifier));
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
    const domainObject = await this.openmct.objects.get(keyString);
    delete provider.pendingIndex[keyString];

    try {
      if (domainObject) {
        await provider.index(domainObject);
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
  #dispatchSearchToWorker({ queryId, searchType, query, maxResults }) {
    const message = {
      request: searchType.toString(),
      input: query,
      maxResults,
      queryId
    };
    this.worker.port.postMessage(message);
  }

  localIndexTags(keyString, objectToIndex, model) {
    // add new tags
    model.tags.forEach((tagID) => {
      if (!this.localIndexedAnnotationsByTag[tagID]) {
        this.localIndexedAnnotationsByTag[tagID] = [];
      }

      const existsInIndex = this.localIndexedAnnotationsByTag[tagID].some((indexedObject) => {
        return indexedObject.keyString === objectToIndex.keyString;
      });

      if (!existsInIndex) {
        this.localIndexedAnnotationsByTag[tagID].push(objectToIndex);
      }
    });
    const tagsToRemoveFromIndex = Object.keys(this.localIndexedAnnotationsByTag).filter(
      (indexedTag) => {
        return !model.tags.includes(indexedTag);
      }
    );
    tagsToRemoveFromIndex.forEach((tagToRemoveFromIndex) => {
      this.localIndexedAnnotationsByTag[tagToRemoveFromIndex] = this.localIndexedAnnotationsByTag[
        tagToRemoveFromIndex
      ].filter((indexedAnnotation) => {
        const shouldKeep = indexedAnnotation.keyString !== keyString;

        return shouldKeep;
      });
    });
  }

  localIndexAnnotation(objectToIndex, model) {
    Object.keys(model.targets).forEach((targetID) => {
      if (!this.localIndexedAnnotationsByDomainObject[targetID]) {
        this.localIndexedAnnotationsByDomainObject[targetID] = [];
      }

      objectToIndex.targets = model.targets;
      objectToIndex.tags = model.tags;
      const existsInIndex = this.localIndexedAnnotationsByDomainObject[targetID].some(
        (indexedObject) => {
          return indexedObject.keyString === objectToIndex.keyString;
        }
      );

      if (!existsInIndex) {
        this.localIndexedAnnotationsByDomainObject[targetID].push(objectToIndex);
      }
    });
  }

  /**
   * A local version of the same SharedWorker function
   * if we don't have SharedWorkers available (e.g., iOS)
   */
  localIndexItem(keyString, model) {
    const objectToIndex = {
      type: model.type,
      name: model.name,
      keyString
    };
    if (model && model.type === 'annotation') {
      if (model.targets) {
        this.localIndexAnnotation(objectToIndex, model);
      }

      if (model.tags) {
        this.localIndexTags(keyString, objectToIndex, model);
      }
    } else {
      this.localIndexedDomainObjects[keyString] = objectToIndex;
    }
  }

  /**
   * A local version of the same SharedWorker function
   * if we don't have SharedWorkers available (e.g., iOS)
   *
   * Gets search results from the indexedItems based on provided search
   * input. Returns matching results from indexedItems
   */
  localSearchForObjects(queryId, searchInput, maxResults) {
    // This results dictionary will have domain object ID keys which
    // point to the value the domain object's score.
    let results = [];
    const input = searchInput.trim().toLowerCase();
    const message = {
      request: 'searchForObjects',
      results: [],
      total: 0,
      queryId
    };

    results =
      Object.values(this.localIndexedDomainObjects).filter((indexedItem) => {
        return indexedItem.name.toLowerCase().includes(input);
      }) || [];

    message.total = results.length;
    message.results = results.slice(0, maxResults);
    const eventToReturn = {
      data: message
    };
    this.onWorkerMessage(eventToReturn);
  }

  /**
   * A local version of the same SharedWorker function
   * if we don't have SharedWorkers available (e.g., iOS)
   */
  localSearchForAnnotations(queryId, searchInput, maxResults) {
    // This results dictionary will have domain object ID keys which
    // point to the value the domain object's score.
    let results = [];
    const message = {
      request: 'searchForAnnotations',
      results: [],
      total: 0,
      queryId
    };

    results = this.localIndexedAnnotationsByDomainObject[searchInput] || [];

    message.total = results.length;
    message.results = results.slice(0, maxResults);
    const eventToReturn = {
      data: message
    };
    this.onWorkerMessage(eventToReturn);
  }

  /**
   * A local version of the same SharedWorker function
   * if we don't have SharedWorkers available (e.g., iOS)
   */
  localSearchForTags(queryId, matchingTagKeys, maxResults) {
    let results = [];
    const message = {
      request: 'searchForTags',
      results: [],
      total: 0,
      queryId
    };

    if (matchingTagKeys) {
      matchingTagKeys.forEach((matchingTag) => {
        const matchingAnnotations = this.localIndexedAnnotationsByTag[matchingTag];
        if (matchingAnnotations) {
          matchingAnnotations.forEach((matchingAnnotation) => {
            const existsInResults = results.some((indexedObject) => {
              return matchingAnnotation.keyString === indexedObject.keyString;
            });
            if (!existsInResults) {
              results.push(matchingAnnotation);
            }
          });
        }
      });
    }

    message.total = results.length;
    message.results = results.slice(0, maxResults);
    const eventToReturn = {
      data: message
    };
    this.onWorkerMessage(eventToReturn);
  }

  destroyObservers(observers) {
    Object.entries(observers).forEach(([keyString, unobserve]) => {
      if (typeof unobserve === 'function') {
        unobserve();
      }

      delete observers[keyString];
    });
  }
}

export default InMemorySearchProvider;
