<template>
<div
    ref="GrandSearch"
    class="c-gsearch"
>
    <search
        ref="shell-search"
        class="c-gsearch__input"
        :value="searchValue"
        @input="searchEverything"
        @clear="searchEverything"
        @click="showSearchResults"
    />
    <SearchResultsDropDown
        ref="searchResultsDropDown"
    />

</div>
</template>

<script>
import search from '../../components/search.vue';
import SearchResultsDropDown from './SearchResultsDropDown.vue';

export default {
    name: 'GrandSearch',
    components: {
        search,
        SearchResultsDropDown
    },
    inject: ['openmct'],
    props: {
    },
    data() {
        return {
            searchValue: '',
            searchLoading: false,
            annotationSearchResults: [],
            objectSearchResults: []
        };
    },
    mounted() {
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
            this.searchLoading = true;
            // clear any previous search results
            this.annotationSearchResults = [];
            this.objectSearchResults = [];

            if (this.searchValue) {
                await this.getSearchResults();
            } else {
                this.searchLoading = false;
                this.$refs.searchResultsDropDown.showResults(this.annotationSearchResults, this.objectSearchResults);
            }
        },
        getPathsForObjects(objectsNeedingPaths) {
            return Promise.all(objectsNeedingPaths.map(async (domainObject) => {
                const keyStringForObject = this.openmct.objects.makeKeyString(domainObject.identifier);
                const originalPathObjects = await this.openmct.objects.getOriginalPath(keyStringForObject);

                return {
                    originalPath: originalPathObjects,
                    ...domainObject
                };
            }));
        },
        async getSearchResults() {
            // an abort controller will be passed in that will be used
            // to cancel an active searches if necessary
            console.debug(`🖲 Would be searching for ${this.searchValue}`);
            this.abortSearchController = new AbortController();
            const abortSignal = this.abortSearchController.signal;
            try {
                this.annotationSearchResults = await this.openmct.annotation.searchForTags(this.searchValue, abortSignal);
                const fullObjectSearchResults = await Promise.all(this.openmct.objects.search(this.searchValue, abortSignal));
                const aggregatedObjectSearchResults = fullObjectSearchResults.flat();
                const aggregatedObjectSearchResultsWithPaths = await this.getPathsForObjects(aggregatedObjectSearchResults);
                const filterAnnotations = aggregatedObjectSearchResultsWithPaths.filter(result => {
                    return result.type !== 'annotation';
                });
                this.objectSearchResults = filterAnnotations;
                console.debug('annotation results have returned', this.annotationSearchResults);
                console.debug('object results have returned', this.objectSearchResults);
                this.showSearchResults();
            } catch (error) {
                console.error(`😞 Error searching`, error);
                this.searchLoading = false;

                if (this.abortSearchController) {
                    delete this.abortSearchController;
                }
            }
        },
        showSearchResults() {
            this.$refs.searchResultsDropDown.showResults(this.annotationSearchResults, this.objectSearchResults);
            document.body.addEventListener('click', this.handleOutsideClick);
        },
        handleOutsideClick(event) {
            // if click event is detected outside the dropdown while the
            // dropdown is visible, this will collapse the dropdown.
            if (this.$refs.GrandSearch) {
                const clickedInsideDropdown = this.$refs.GrandSearch.contains(event.target);
                if (!clickedInsideDropdown && this.$refs.searchResultsDropDown._data.resultsShown) {
                    this.$refs.searchResultsDropDown._data.resultsShown = false;
                }
            }
        }
    }
};
</script>
