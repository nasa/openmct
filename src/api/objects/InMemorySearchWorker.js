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

/**
 * Module defining InMemorySearchWorker. Created by deeptailor on 10/03/2019.
 */
(function () {
  // An object composed of domain object IDs and models
  // {id: domainObject's ID, name: domainObject's name}
  const indexedDomainObjects = {};
  const indexedAnnotationsByDomainObject = {};
  const indexedAnnotationsByTag = {};

  self.onconnect = function (e) {
    const port = e.ports[0];

    port.onmessage = function (event) {
      const requestType = event.data.request;
      if (requestType === 'index') {
        indexItem(event.data.keyString, event.data.model);
      } else if (requestType === 'OBJECTS') {
        port.postMessage(searchForObjects(event.data));
      } else if (requestType === 'ANNOTATIONS') {
        port.postMessage(searchForAnnotations(event.data));
      } else if (requestType === 'TAGS') {
        port.postMessage(searchForTags(event.data));
      } else {
        throw new Error(`Unknown request ${event.data.request}`);
      }
    };

    port.start();
  };

  self.onerror = function (error) {
    //do nothing
    console.error('Error on feed', error);
  };

  function indexAnnotation(objectToIndex, model) {
    Object.keys(model.targets).forEach((targetID) => {
      if (!indexedAnnotationsByDomainObject[targetID]) {
        indexedAnnotationsByDomainObject[targetID] = [];
      }

      objectToIndex.targets = model.targets;
      objectToIndex.tags = model.tags;
      const existsInIndex = indexedAnnotationsByDomainObject[targetID].some((indexedObject) => {
        return indexedObject.keyString === objectToIndex.keyString;
      });

      if (!existsInIndex) {
        indexedAnnotationsByDomainObject[targetID].push(objectToIndex);
      }
    });
  }

  function indexTags(keyString, objectToIndex, model) {
    // add new tags
    model.tags.forEach((tagID) => {
      if (!indexedAnnotationsByTag[tagID]) {
        indexedAnnotationsByTag[tagID] = [];
      }

      const existsInIndex = indexedAnnotationsByTag[tagID].some((indexedObject) => {
        return indexedObject.keyString === objectToIndex.keyString;
      });

      if (!existsInIndex) {
        indexedAnnotationsByTag[tagID].push(objectToIndex);
      }
    });
    // remove old tags
    const tagsToRemoveFromIndex = Object.keys(indexedAnnotationsByTag).filter((indexedTag) => {
      return !model.tags.includes(indexedTag);
    });
    tagsToRemoveFromIndex.forEach((tagToRemoveFromIndex) => {
      indexedAnnotationsByTag[tagToRemoveFromIndex] = indexedAnnotationsByTag[
        tagToRemoveFromIndex
      ].filter((indexedAnnotation) => {
        const shouldKeep = indexedAnnotation.keyString !== keyString;

        return shouldKeep;
      });
    });
  }

  function indexItem(keyString, model) {
    const objectToIndex = {
      type: model.type,
      name: model.name,
      keyString
    };
    if (model && model.type === 'annotation') {
      if (model.targets) {
        indexAnnotation(objectToIndex, model);
      }

      if (model.tags) {
        indexTags(keyString, objectToIndex, model);
      }
    } else {
      indexedDomainObjects[keyString] = objectToIndex;
    }
  }

  /**
   * Gets search results from the indexedItems based on provided search
   *   input. Returns matching results from indexedItems
   *
   * @param data An object which contains:
   *           * input: The original string which we are searching with
   *           * maxResults: The maximum number of search results desired
   *           * queryId: an id identifying this query, will be returned.
   */
  function searchForObjects(data) {
    let results = [];
    const input = data.input.trim().toLowerCase();
    const message = {
      request: 'searchForObjects',
      results: [],
      total: 0,
      queryId: data.queryId
    };

    results =
      Object.values(indexedDomainObjects).filter((indexedItem) => {
        return indexedItem.name.toLowerCase().includes(input);
      }) || [];

    message.total = results.length;
    message.results = results.slice(0, data.maxResults);

    return message;
  }

  function searchForAnnotations(data) {
    let results = [];
    const message = {
      request: 'searchForAnnotations',
      results: [],
      total: 0,
      queryId: data.queryId
    };

    results = indexedAnnotationsByDomainObject[data.input] || [];

    message.total = results.length;
    message.results = results.slice(0, data.maxResults);

    return message;
  }

  function searchForTags(data) {
    let results = [];
    const message = {
      request: 'searchForTags',
      results: [],
      total: 0,
      queryId: data.queryId
    };

    if (data.input) {
      data.input.forEach((matchingTag) => {
        const matchingAnnotations = indexedAnnotationsByTag[matchingTag];
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
    message.results = results.slice(0, data.maxResults);

    return message;
  }
})();
