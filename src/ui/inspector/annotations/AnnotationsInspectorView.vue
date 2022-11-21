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
<div class="c-inspector__properties c-inspect-properties has-tag-applier">
    <div class="c-inspect-properties__header">
        Tags
    </div>
    <div
        v-if="annotationType"
        class="c-inspect-properties__section"
    >
        <TagEditor
            :domain-object="domainObject"
            :annotations="annotations"
            :annotation-type="annotationType"
            :on-tag-change="onTagChange"
            :target-specific-details="targetSpecificDetails"
        />
    </div>
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
            v-for="(annotation, index) in nonTagAnnotations"
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
import _ from 'lodash';

export default {
    components: {
        AnnotationEditor,
        TagEditor
    },
    inject: ['openmct'],
    data() {
        return {
            selection: null,
            lastLocalAnnotationCreation: 0,
            annotations: []
        };
    },
    computed: {
        hasAnnotations() {
            return Boolean(
                this.nonTagAnnotations
                && this.nonTagAnnotations.length
                && !this.multiSelection
            );
        },
        nonTagAnnotations() {
            return this.annotations.filter(annotation => {
                return !annotation.tags && !annotation._deleted;
            });
        },
        tagAnnotations() {
            return this.annotations.filter(annotation => {
                return annotation.tags && !annotation._deleted;
            });
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
        },
        domainObject() {
            return this?.selection?.[0]?.[0]?.context?.item;
        },
        targetSpecificDetails() {
            return this?.selection?.[0]?.[1]?.context?.targetSpecificDetails;
        },
        annotationType() {
            return this?.selection?.[0]?.[1]?.context?.annotationType;
        },
        onTagChange() {
            return this?.selection?.[0]?.[1]?.context?.onTagChange;
        }
    },
    async mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        await this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
        if (this.unobserveEntries) {
            this.unobserveEntries();
        }
    },
    methods: {
        async loadAnnotations() {
            if (!this.openmct.annotation.getAvailableTags().length) {
                return;
            }

            if (!this.domainObject || !this.annotationType) {
                this.annotations.splice(0);

                return;
            }

            const domainObjectKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            console.debug(`🍇 Loading annotations for ${domainObjectKeyString}`);

            const totalAnnotations = await this.openmct.annotation.getAnnotations(domainObjectKeyString);
            if (!totalAnnotations) {
                this.annotations.splice(0);

                return;
            }

            console.debug(`🍇 Found ${totalAnnotations.length} annotations`);

            const targetFilteredAnnotations = totalAnnotations.filter(annotation => {
                const targetSpecificDetailsEqual = _.isEqual(annotation.targets[domainObjectKeyString], this.targetSpecificDetails);

                return targetSpecificDetailsEqual;
            });

            const mutableAnnotations = targetFilteredAnnotations.map(annotation => {
                return this.openmct.objects.toMutable(annotation);
            });

            const sortedAnnotations = mutableAnnotations.sort((annotationA, annotationB) => {
                return annotationB.modified - annotationA.modified;
            });

            if (sortedAnnotations.length < this.annotations.length) {
                this.annotations = this.annotations.slice(0, sortedAnnotations.length);
            }

            for (let index = 0; index < sortedAnnotations.length; index += 1) {
                this.$set(this.annotations, index, sortedAnnotations[index]);
            }
        },
        async updateSelection(selection) {
            if (this.unobserveEntries) {
                this.unobserveEntries();
            }

            this.selection = selection;
            if (this.domainObject) {
                this.lastLocalAnnotationCreation = this.domainObject?.annotationLastCreated ?? 0;
                this.unobserveEntries = this.openmct.objects.observe(this.domainObject, '*', this.domainObjectChanged);
                await this.loadAnnotations();
            }
        },
        domainObjectChanged() {
            if (this.domainObject && (this.lastLocalAnnotationCreation < this.domainObject.annotationLastCreated)) {
                this.loadAnnotations();
            }
        }
    }
};
</script>
