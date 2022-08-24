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

<template>
<div
    class="c-gsearch__dropdown"
>
    <div
        v-show="resultsShown"
        class="c-gsearch__results-wrapper"
    >
        <div class="c-gsearch__results">
            <div
                v-if="objectResults && objectResults.length"
                ref="objectResults"
                class="c-gsearch__results-section"
                role="listbox"
            >
                <div class="c-gsearch__results-section-title">Object Results</div>
                <object-search-result
                    v-for="(objectResult) in objectResults"
                    :key="openmct.objects.makeKeyString(objectResult.identifier)"
                    :result="objectResult"
                    @preview-changed="previewChanged"
                    @click.native="selectedResult"
                />
            </div>
            <div
                v-if="annotationResults && annotationResults.length"
                ref="annotationResults"
            >
                <div class="c-gsearch__results-section-title">Annotation Results</div>
                <annotation-search-result
                    v-for="(annotationResult) in annotationResults"
                    :key="openmct.objects.makeKeyString(annotationResult.identifier)"
                    :result="annotationResult"
                    @click.native="selectedResult"
                />
            </div>
            <div
                v-if="searchLoading"
            > <progress-bar
                :model="{progressText: 'Searching...',
                         progressPerc: undefined
                }"
            />
            </div>
            <div
                v-if="!searchLoading && (!annotationResults || !annotationResults.length) &&
                    (!objectResults || !objectResults.length)"
            >No matching results.
            </div>
        </div>
    </div>
</div></template>

<script>
import AnnotationSearchResult from './AnnotationSearchResult.vue';
import ObjectSearchResult from './ObjectSearchResult.vue';
import ProgressBar from '@/ui/components/ProgressBar.vue';

export default {
    name: 'SearchResultsDropDown',
    components: {
        AnnotationSearchResult,
        ObjectSearchResult,
        ProgressBar
    },
    inject: ['openmct'],
    data() {
        return {
            resultsShown: false,
            searchLoading: false,
            annotationResults: [],
            objectResults: [],
            previewVisible: false
        };
    },
    methods: {
        selectedResult() {
            if (!this.previewVisible) {
                this.resultsShown = false;
            }
        },
        previewChanged(changedPreviewState) {
            this.previewVisible = changedPreviewState;
        },
        showSearchStarted() {
            this.searchLoading = true;
            this.resultsShown = true;
            this.annotationResults = [];
            this.objectResults = [];
        },
        showResults({searchLoading, searchValue, annotationSearchResults, objectSearchResults}) {
            this.searchLoading = searchLoading;
            this.annotationResults = annotationSearchResults;
            this.objectResults = objectSearchResults;
            if (searchValue?.length) {
                this.resultsShown = true;
            } else {
                this.resultsShown = false;
            }
        }
    },
    template: 'Dropdown'
};
</script>
