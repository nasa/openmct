<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <div ref="GrandSearch" aria-label="OpenMCT Search" class="c-gsearch" role="search">
    <SearchResultsDropDown ref="searchResultsDropDown" />
    <Search
      ref="shell-search"
      class="c-gsearch__input"
      :value="searchValue"
      @input="searchEverything"
      @clear="searchEverything"
      @click="showSearchResults"
    />
  </div>
</template>

<script>
import Search from '../../components/SearchComponent.vue';
import SearchResultsDropDown from './SearchResultsDropDown.vue';

const SEARCH_DEBOUNCE_TIME = 200;

export default {
  name: 'GrandSearch',
  components: {
    Search,
    SearchResultsDropDown
  },
  inject: ['openmct'],
  props: {},
  data() {
    return {
      searchValue: '',
      debouncedSearchTimeoutID: null,
      searchLoading: false,
      annotationSearchResults: [],
      objectSearchResults: []
    };
  },
  mounted() {
    this.searchResultLocationObservers = {};
    this.getSearchResults = this.debounceAsyncFunction(this.getSearchResults, SEARCH_DEBOUNCE_TIME);
  },
  unmounted() {
    document.body.removeEventListener('click', this.handleOutsideClick);
    this.clearSearchResultLocationObservers();
  },
  methods: {
    async searchEverything(value) {
      // if an abort controller exists, regardless of the value passed in,
      // there is an active search that should be canceled
      if (this.abortSearchController) {
        this.abortSearchController.abort();
        delete this.abortSearchController;
      }

      this.searchValue = value;
      this.clearSearchResultLocationObservers();
      // clear any previous search results
      this.annotationSearchResults = [];
      this.objectSearchResults = [];

      if (this.searchValue) {
        await this.getSearchResults();
      } else {
        clearTimeout(this.debouncedSearchTimeoutID);
        const dropdownOptions = {
          searchLoading: this.searchLoading,
          searchValue: this.searchValue,
          annotationSearchResults: this.annotationSearchResults,
          objectSearchResults: this.objectSearchResults
        };
        this.$refs.searchResultsDropDown.showResults(dropdownOptions);
      }
    },
    debounceAsyncFunction(functionToDebounce, debounceTime) {
      return (...args) => {
        clearTimeout(this.debouncedSearchTimeoutID);

        return new Promise((resolve, reject) => {
          this.debouncedSearchTimeoutID = setTimeout(() => {
            functionToDebounce(...args)
              .then(resolve)
              .catch(reject);
          }, debounceTime);
        });
      };
    },
    getPathsForObjects(objectsNeedingPaths, abortSignal) {
      return Promise.all(
        objectsNeedingPaths.map(async (domainObject) => {
          if (!domainObject) {
            // user interrupted search, return back
            return null;
          }

          const originalPathObjects = await this.openmct.objects.getOriginalPath(
            domainObject,
            [],
            abortSignal
          );

          return {
            objectPath: originalPathObjects,
            ...domainObject
          };
        })
      );
    },
    async getSearchResults() {
      // an abort controller will be passed in that will be used
      // to cancel an active searches if necessary
      this.searchLoading = true;
      this.$refs.searchResultsDropDown.showSearchStarted();
      this.abortSearchController = new AbortController();

      try {
        const searchObjectsPromise = this.searchObjects(this.abortSearchController.signal);
        const searchAnnotationsPromise = this.searchAnnotations(this.abortSearchController.signal);

        // Wait for all promises, but they process their results as they complete
        await Promise.allSettled([searchObjectsPromise, searchAnnotationsPromise]);

        this.searchLoading = false;
        this.showSearchResults();
      } catch (error) {
        this.searchLoading = false;

        // Is this coming from the AbortController?
        // If so, we can swallow the error. If not, 🤮 it to console
        if (error.name !== 'AbortError') {
          console.error(`😞 Error searching`, error);
        }
      } finally {
        if (this.abortSearchController) {
          delete this.abortSearchController;
        }
      }
    },
    async searchObjects(abortSignal) {
      const objectSearchPromises = this.openmct.objects.search(this.searchValue, abortSignal);
      for await (const objectSearchResult of objectSearchPromises) {
        const objectsWithPaths = await this.getPathsForObjects(objectSearchResult, abortSignal);
        const reachableObjectResults = objectsWithPaths.filter((result) => {
          // Check if the result is NOT an annotation and has a reachable path
          return (
            !this.openmct.annotation.isAnnotation(result) &&
            this.openmct.objects.isReachable(result?.objectPath)
          );
        });

        this.observeSearchResultLocations(reachableObjectResults);
        this.objectSearchResults.push(...reachableObjectResults);
        // Display the available results so far for objects
        this.showSearchResults();
      }
    },
    observeSearchResultLocations(searchResults) {
      searchResults.forEach((searchResult) => {
        const keyString = this.openmct.objects.makeKeyString(searchResult.identifier);
        if (!this.searchResultLocationObservers[keyString]) {
          this.searchResultLocationObservers[keyString] = this.openmct.objects.observe(
            searchResult,
            'location',
            this.onSearchResultLocationChanged.bind(this, searchResult.identifier)
          );
        }
      });
    },
    onSearchResultLocationChanged(identifier, location) {
      if (location !== null) {
        return;
      }

      for (let index = this.objectSearchResults.length - 1; index >= 0; index--) {
        const searchResult = this.objectSearchResults[index];
        if (this.openmct.objects.areIdsEqual(searchResult.identifier, identifier)) {
          this.objectSearchResults.splice(index, 1);
        }
      }

      const keyString = this.openmct.objects.makeKeyString(identifier);
      this.searchResultLocationObservers[keyString]?.();
      delete this.searchResultLocationObservers[keyString];
    },
    clearSearchResultLocationObservers() {
      Object.values(this.searchResultLocationObservers ?? {}).forEach((unobserve) => unobserve());
      this.searchResultLocationObservers = {};
    },
    async searchAnnotations(abortSignal) {
      const annotationSearchResults = await this.openmct.annotation.searchForTags(
        this.searchValue,
        abortSignal
      );
      this.annotationSearchResults = annotationSearchResults;
      // Display the available results so far for annotations
      this.showSearchResults();
    },
    showSearchResults() {
      const dropdownOptions = {
        searchLoading: this.searchLoading,
        searchValue: this.searchValue,
        annotationSearchResults: this.annotationSearchResults,
        objectSearchResults: this.objectSearchResults
      };
      this.$refs.searchResultsDropDown.showResults(dropdownOptions);
      document.body.addEventListener('click', this.handleOutsideClick);
    },
    handleOutsideClick(event) {
      // if click event is detected outside the dropdown while the
      // dropdown is visible, this will collapse the dropdown.
      if (this.$refs.GrandSearch) {
        const clickedInsideDropdown = this.$refs.GrandSearch.contains(event.target);
        const clickedPreviewClose =
          event.target.parentElement &&
          event.target.parentElement.querySelector('.js-preview-window');
        const searchResultsDropDown = this.$refs.searchResultsDropDown._.data;
        if (
          !clickedInsideDropdown &&
          searchResultsDropDown.resultsShown &&
          !searchResultsDropDown.previewVisible &&
          !clickedPreviewClose
        ) {
          searchResultsDropDown.resultsShown = false;
          document.body.removeEventListener('click', this.handleOutsideClick);
        }
      }
    }
  }
};
</script>
