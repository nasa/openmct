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
<div class="c-tag-applier">
    <TagSelection
        v-for="(addedTag, index) in addedTags"
        :key="index"
        :selected-tag="addedTag.newTag ? null : addedTag"
        :new-tag="addedTag.newTag"
        :added-tags="addedTags"
        @tagRemoved="tagRemoved"
        @tagAdded="tagAdded"
    />
    <button
        v-show="!userAddingTag && !maxTagsAdded"
        class="c-tag-applier__add-btn c-icon-button c-icon-button--major icon-plus"
        title="Add new tag"
        @click="addTag"
    >
        <div class="c-icon-button__label">Add Tag</div>
    </button>
</div>
</template>

<script>
import TagSelection from './TagSelection.vue';

export default {
    components: {
        TagSelection
    },
    inject: ['openmct'],
    props: {
        annotationQuery: {
            type: Object,
            required: true
        },
        annotationType: {
            type: String,
            required: true
        },
        annotationSearchType: {
            type: String,
            required: true
        },
        targetSpecificDetails: {
            type: Object,
            required: true
        },
        domainObject: {
            type: Object,
            default() {
                return null;
            }
        }
    },
    data() {
        return {
            annontations: [],
            addedTags: [],
            userAddingTag: false,
            deleteAnnotationListeners: []
        };
    },
    computed: {
        availableTags() {
            return this.openmct.annotation.getAvailableTags();
        },
        maxTagsAdded() {
            const availableTags = this.openmct.annotation.getAvailableTags();

            return !(availableTags && availableTags.length && (this.addedTags.length < availableTags.length));
        }
    },
    watch: {
        annotations: {
            handler() {
                this.tagsChanged();
            },
            deep: true
        },
        annotationQuery: {
            handler() {
                this.unloadAnnotations();
                this.loadAnnotations();
            },
            deep: true
        }
    },
    mounted() {
        this.loadAnnotations();
    },
    destroyed() {
        this.deleteAnnotationListeners.forEach(deleteAnnotationListener => {
            deleteAnnotationListener();
        });
    },
    methods: {
        addAnnotationListeners(annotations) {
            annotations.forEach(annotation => {
                const deleteAnnotationListener = this.openmct.objects.observe(annotation, 'deleted', (deletedAnnotation) => {
                    this.annotations = this.annontations.filter(existingAnnotation => {
                        if (this.openmct.objects.areIdsEqual(existingAnnotation, deletedAnnotation)) {
                            return !(deletedAnnotation.deleted);
                        }

                        return true;
                    });
                    this.tagsChanged();
                });
                this.deleteAnnotationListeners.push(deleteAnnotationListener);
            });
        },
        async loadAnnotations() {
            if (!this.availableTags.length) {
                return;
            }

            this.annotations = await this.openmct.annotation.getAnnotations(this.annotationQuery, this.annotationSearchType);
            this.addAnnotationListeners(this.annotations);
            if (this.annotations && this.annotations.length) {
                this.tagsChanged();
            }
        },
        unloadAnnotations() {
            this.deleteAnnotationListeners.forEach(deleteAnnotationListener => {
                deleteAnnotationListener();
            });
            this.deleteAnnotationListeners = [];
        },
        tagsChanged() {
            // TODO translate annotations to addedTags
            // if (newTags.length < this.addedTags.length) {
            //     this.addedTags = this.addedTags.slice(0, newTags.length);
            // }

            // for (let index = 0; index < newTags.length; index += 1) {
            //     this.$set(this.addedTags, index, newTags[index]);
            // }
        },
        addTag() {
            const newTagValue = {
                newTag: true
            };
            this.addedTags.push(newTagValue);
            this.userAddingTag = true;
        },
        async tagRemoved(tagToRemove) {
            // TODO soft delete annotations that match tag instead
            const result = await this.openmct.annotation.softDeleteAnnotations(this.annotations);
            this.$emit('tags-updated');

            return result;
        },
        async tagAdded(newTag) {
            // TODO either undelete an annotation, or create one (1) new annotation
            const existingAnnotation = this.annotations.find((annotation) => {
                return annotation.tags.includes(newTag);
            });

            const createdAnnotation = await this.openmct.annotation.addSingleAnnotationTag(existingAnnotation,
                this.domainObject, this.targetSpecificDetails, this.annotationType, newTag);
            this.addedTags.concat(createdAnnotation.tags);
            this.userAddingTag = false;

            this.$emit('tags-updated');
        }
    }
};
</script>
