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

// This provider exists because due to legacy reasons, we need to install
// two plugins for two namespaces for CouchDB: one for "mct", and one for "".
// Because of this, we need to separate out the search provider from the object
// provider so we don't return two results for each found object.
// If the above namespace is ever resolved, we can fold this search provider
// back into the object provider.

const BATCH_ANNOTATION_DEBOUNCE_MS = 100;

class CouchSearchProvider {
  #bulkPromise;
  #batchIds;
  #lastAbortSignal;

  constructor(couchObjectProvider) {
    this.couchObjectProvider = couchObjectProvider;
    this.searchTypes = couchObjectProvider.openmct.objects.SEARCH_TYPES;
    this.useDesignDocuments = couchObjectProvider.useDesignDocuments;
    this.supportedSearchTypes = [
      this.searchTypes.OBJECTS,
      this.searchTypes.ANNOTATIONS,
      this.searchTypes.TAGS
    ];
    this.#batchIds = [];
    this.#bulkPromise = null;
  }

  supportsSearchType(searchType) {
    return this.supportedSearchTypes.includes(searchType);
  }

  search(query, abortSignal, searchType) {
    if (searchType === this.searchTypes.OBJECTS) {
      return this.searchForObjects(query, abortSignal);
    } else if (searchType === this.searchTypes.ANNOTATIONS) {
      return this.searchForAnnotations(query, abortSignal);
    } else if (searchType === this.searchTypes.TAGS) {
      return this.searchForTags(query, abortSignal);
    } else {
      throw new Error(`🤷‍♂️ Unknown search type passed: ${searchType}`);
    }
  }

  searchForObjects(query, abortSignal) {
    const filter = {
      selector: {
        model: {
          name: {
            $regex: `(?i)${query}`
          }
        }
      }
    };

    return this.couchObjectProvider.getObjectsByFilter(filter, abortSignal);
  }

  async #deferBatchAnnotationSearch() {
    // We until the next event loop cycle to "collect" all of the get
    // requests triggered in this iteration of the event loop
    await this.#waitForDebounce();
    const batchIdsToSearch = [...this.#batchIds];
    this.#clearBatch();
    return this.#bulkAnnotationSearch(batchIdsToSearch);
  }

  #clearBatch() {
    this.#batchIds = [];
    this.#bulkPromise = undefined;
  }

  #waitForDebounce() {
    let timeoutID;
    clearTimeout(timeoutID);

    return new Promise((resolve) => {
      timeoutID = setTimeout(() => {
        resolve();
      }, BATCH_ANNOTATION_DEBOUNCE_MS);
    });
  }

  #bulkAnnotationSearch(batchIdsToSearch) {
    if (!batchIdsToSearch?.length) {
      // nothing to search
      return;
    }

    let lastAbortSignal = batchIdsToSearch[batchIdsToSearch.length - 1].abortSignal;

    if (this.useDesignDocuments) {
      const keysToSearch = batchIdsToSearch.map(({ keyString }) => keyString);
      return this.couchObjectProvider.getObjectsByView(
        {
          designDoc: 'annotation_keystring_index',
          viewName: 'by_keystring',
          keysToSearch
        },
        lastAbortSignal
      );
    }

    const filter = {
      selector: {
        $and: [
          {
            'model.type': {
              $eq: 'annotation'
            }
          },
          {
            'model.targets': {
              $elemMatch: {
                keyString: {
                  $in: []
                }
              }
            }
          }
        ]
      }
    };
    // TODO: should remove duplicates from batchIds
    batchIdsToSearch.forEach(({ keyString, abortSignal }) => {
      filter.selector.$and[1]['model.targets'].$elemMatch.keyString.$in.push(keyString);
    });

    return this.couchObjectProvider.getObjectsByFilter(filter, lastAbortSignal);
  }

  async searchForAnnotations(keyString, abortSignal) {
    this.#batchIds.push({ keyString, abortSignal });
    if (!this.#bulkPromise) {
      this.#bulkPromise = this.#deferBatchAnnotationSearch();
    }

    const returnedData = await this.#bulkPromise;
    return returnedData;
  }

  searchForTags(tagsArray, abortSignal) {
    if (!tagsArray || !tagsArray.length) {
      return [];
    }

    if (this.useDesignDocuments) {
      return this.couchObjectProvider.getObjectsByView(
        { designDoc: 'annotation_tags_index', viewName: 'by_tags', keysToSearch: tagsArray },
        abortSignal
      );
    }

    const filter = {
      selector: {
        $and: [
          {
            'model.type': {
              $eq: 'annotation'
            }
          },
          {
            'model.tags': {
              $elemMatch: {
                $in: []
              }
            }
          }
        ]
      }
    };
    tagsArray.forEach((tag) => {
      filter.selector.$and[1]['model.tags'].$elemMatch.$in.push(tag);
    });

    return this.couchObjectProvider.getObjectsByFilter(filter, abortSignal);
  }
}
export default CouchSearchProvider;
