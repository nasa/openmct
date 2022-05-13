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
<div class="c-inspector__properties c-inspect-properties">
    <div class="c-inspect-properties__header">
        Tags
    </div>
    <ul
        v-if="hasTags"
        class="c-inspect-properties__section"
    >
        <TagEditor
            :domain-object="getDomainObject()"
            :annotation="annotations[0]"
            :entry="null"
        />
    </ul>
    <div
        v-else
        class="c-inspect-properties__row--span-all"
    >
        {{ noTagsMessage }}
    </div>
    <div class="c-inspect-properties__header">
        Annotations
    </div>
    <div
        v-if="hasAnnotations"
        class="c-inspect-properties__section c-annotation__list"
    >
        <AnnotationEditor
            v-for="(annotation, index) in annotations"
            :key="index"
            :annotation="annotation"
        />
    </div>
    <div
        v-else
        class="c-inspect-properties__row--span-all"
    >
        {{ noAnnotationsMessage }}
    </div>
</div>
</template>

<script>
import AnnotationEditor from './AnnotationEditor.vue';
import TagEditor from '../../components/tags/TagEditor.vue';

export default {
    components: {
        AnnotationEditor,
        TagEditor
    },
    inject: ['openmct'],
    data() {
        return {
            selection: null,
            annotations: []
        };
    },
    computed: {
        hasAnnotations() {
            return Boolean(
                this.annotations
                && this.annotations.length
                && !this.multiSelection
            );
        },
        hasTags() {
            return Boolean(
                this.annotations
                && this.annotations.length
                && !this.multiSelection
            );
        },
        multiSelection() {
            return this.selection && this.selection.length > 1;
        },
        noAnnotationsMessage() {
            return this.multiSelection
                ? 'No annotations to display for multiple items'
                : 'No annotations to display for this item';
        },
        noTagsMessage() {
            return this.multiSelection
                ? 'No tags to display for multiple items'
                : 'No tags to display for this item';
        }
    },
    mounted() {
        this.stopListeningToChanges = this.openmct.selection.on('change', this.updateSelection);
        this.stopListeningToAnnotationCreation = this.openmct.annotation.on('annotationCreated', this.annotationCreated);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
        if (this.stopListeningToChanges) {
            this.stopListeningToChanges();
        }

        if (this.stopListeningToAnnotationCreation) {
            this.stopListeningToAnnotationCreation();
        }
    },
    methods: {
        async updateSelection(selection) {
            this.selection = selection;
            const domainObject = this.getDomainObject();
            if (domainObject) {
                let totalAnnotations = await this.openmct.annotation.get(domainObject);
                if (!totalAnnotations) {
                    this.annotations = [];

                    return;
                }

                const sortedAnnotations = totalAnnotations.sort((annotationA, annotationB) => {
                    return annotationB.modified - annotationA.modified;
                });
                if (sortedAnnotations.length < this.annotations.length) {
                    this.annotations = this.annotations.slice(0, sortedAnnotations.length);
                }

                for (let index = 0; index < sortedAnnotations.length; index += 1) {
                    this.$set(this.annotations, index, sortedAnnotations[index]);
                }
            } else {
                this.annotations = [];
            }
        },
        annotationCreated(annotationObject) {
            this.updateSelection(this.openmct.selection.get());
        },
        getDomainObject() {
            if (this.selection && this.selection[0] && this.selection[0][0] && this.selection[0][0].context) {
                return this.selection[0][0].context.item;
            }

            return null;
        }
    }
};
</script>
