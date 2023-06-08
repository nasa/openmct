<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <div ref="GrandSearch" aria-label="OpenMCT Search" class="c-gsearch" role="searchbox">
    <search
      ref="shell-search"
      class="c-gsearch__input"
      tabindex="0"
      :value="searchValue"
      @input="searchEverything"
      @clear="searchEverything"
      @click="showSearchResults"
    />
    <SearchResultsDropDown ref="searchResultsDropDown" />
  </div>
</template>

<script>
import search from '../../components/search.vue';
import SearchResultsDropDown from './SearchResultsDropDown.vue';

const SEARCH_DEBOUNCE_TIME = 200;

export default {
  name: 'GrandSearch',
  components: {
    search,
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
    this.getSearchResults = this.debounceAsyncFunction(this.getSearchResults, SEARCH_DEBOUNCE_TIME);
  },
  destroyed() {
    document.body.removeEventListener('click', this.handleOutsideClick);
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
    getPathsForObjects(objectsNeedingPaths) {
      return Promise.all(
        objectsNeedingPaths.map(async (domainObject) => {
          if (!domainObject) {
            // user interrupted search, return back
            return null;
          }

          const keyStringForObject = this.openmct.objects.makeKeyString(domainObject.identifier);
          const originalPathObjects = await this.openmct.objects.getOriginalPath(
            keyStringForObject
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
      const abortSignal = this.abortSearchController.signal;
      try {
        this.annotationSearchResults = await this.openmct.annotation.searchForTags(
          this.searchValue,
          abortSignal
        );
        const fullObjectSearchResults = await Promise.all(
          this.openmct.objects.search(this.searchValue, abortSignal)
        );
        const aggregatedObjectSearchResults = fullObjectSearchResults.flat();
        const aggregatedObjectSearchResultsWithPaths = await this.getPathsForObjects(
          aggregatedObjectSearchResults
        );
        const filterAnnotationsAndValidPaths = aggregatedObjectSearchResultsWithPaths.filter(
          (result) => {
            if (this.openmct.annotation.isAnnotation(result)) {
              return false;
            }

            return this.openmct.objects.isReachable(result?.objectPath);
          }
        );
        this.objectSearchResults = filterAnnotationsAndValidPaths;
        this.searchLoading = false;
        this.showSearchResults();
      } catch (error) {
        this.searchLoading = false;

        if (this.abortSearchController) {
          delete this.abortSearchController;
        }

        // Is this coming from the AbortController?
        // If so, we can swallow the error. If not, 🤮 it to console
        if (error.name !== 'AbortError') {
          console.error(`😞 Error searching`, error);
        }
      }
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
        const searchResultsDropDown = this.$refs.searchResultsDropDown._data;
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
