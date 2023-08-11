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
  <div ref="TagEditor" class="c-tag-applier">
    <TagSelection
      v-for="(addedTag, index) in addedTags"
      :key="index"
      :class="{ 'w-tag-wrapper--tag-selector': addedTag.newTag }"
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
      <div class="c-icon-button__label c-tag-btn__label">Add Tag</div>
    </button>
  </div>
</template>

<script>
import TagSelection from './TagSelection.vue';
import { toRaw } from 'vue';

export default {
  components: {
    TagSelection
  },
  inject: ['openmct'],
  props: {
    annotations: {
      type: Array,
      required: true
    },
    annotationType: {
      type: String,
      required: false,
      default: null
    },
    domainObject: {
      type: Object,
      required: true,
      default: null
    },
    targets: {
      type: Object,
      required: true,
      default: null
    },
    targetDomainObjects: {
      type: Object,
      required: true,
      default: null
    },
    onTagChange: {
      type: Function,
      required: false,
      default: null
    }
  },
  data() {
    return {
      addedTags: [],
      userAddingTag: false
    };
  },
  computed: {
    availableTags() {
      return this.openmct.annotation.getAvailableTags();
    },
    maxTagsAdded() {
      const availableTags = this.openmct.annotation.getAvailableTags();

      return !(
        availableTags &&
        availableTags.length &&
        this.addedTags.length < availableTags.length
      );
    }
  },
  watch: {
    annotations: {
      handler() {
        this.annotationsChanged();
      },
      deep: true
    }
  },
  mounted() {
    this.annotationsChanged();
  },
  unmounted() {
    document.body.removeEventListener('click', this.tagCanceled);
  },
  methods: {
    annotationsChanged() {
      if (this.annotations) {
        this.tagsChanged();
      }
    },
    annotationDeletionListener(changedAnnotation) {
      const matchingAnnotation = this.annotations.find((possibleMatchingAnnotation) => {
        return this.openmct.objects.areIdsEqual(
          possibleMatchingAnnotation.identifier,
          changedAnnotation.identifier
        );
      });
      if (matchingAnnotation) {
        matchingAnnotation._deleted = changedAnnotation._deleted;
        this.userAddingTag = false;
        this.tagsChanged();
      }
    },
    tagsChanged() {
      // gather tags from annotations
      const tagsFromAnnotations = this.annotations
        .flatMap((annotation) => {
          if (annotation._deleted) {
            return [];
          } else {
            return annotation.tags;
          }
        })
        .filter((tag, index, array) => {
          return array.indexOf(tag) === index;
        });

      if (tagsFromAnnotations.length !== this.addedTags.length) {
        this.addedTags = this.addedTags.slice(0, tagsFromAnnotations.length);
      }

      for (let index = 0; index < tagsFromAnnotations.length; index += 1) {
        this.addedTags[index] = tagsFromAnnotations[index];
      }
    },
    addTag() {
      const newTagValue = {
        newTag: true
      };
      this.addedTags.push(newTagValue);
      this.userAddingTag = true;
      document.body.addEventListener('click', this.tagCanceled);
    },
    async tagRemoved(tagToRemove) {
      // Soft delete annotations that match tag instead (that aren't already deleted)
      const annotationsToDelete = this.annotations.filter((annotation) => {
        return annotation.tags.includes(tagToRemove) && !annotation._deleted;
      });
      if (annotationsToDelete) {
        await this.openmct.annotation.deleteAnnotations(annotationsToDelete);
        this.$emit('tags-updated', annotationsToDelete);
        if (this.onTagChange) {
          this.userAddingTag = false;
          this.onTagChange(this.annotations);
        }
      }
    },
    tagCanceled(event) {
      if (this.$refs.TagEditor) {
        const clickedInsideTagEditor = this.$refs.TagEditor.contains(event.target);
        if (!clickedInsideTagEditor) {
          // Hide TagSelection and show "Add Tag" button
          this.userAddingTag = false;
          this.tagsChanged();
        }
      }
    },
    async tagAdded(newTag) {
      // Either undelete an annotation, or create one (1) new annotation
      let existingAnnotation = this.annotations.find((annotation) => {
        return annotation.tags.includes(newTag);
      });

      if (!existingAnnotation) {
        const contentText = `${this.annotationType} tag`;

        // need to get raw version of target domain objects for comparisons to work
        const rawTargetDomainObjects = {};
        Object.keys(this.targetDomainObjects).forEach((targetDomainObjectKey) => {
          rawTargetDomainObjects[targetDomainObjectKey] = toRaw(
            this.targetDomainObjects[targetDomainObjectKey]
          );
        });
        const annotationCreationArguments = {
          name: contentText,
          existingAnnotation,
          contentText: contentText,
          targets: toRaw(this.targets),
          targetDomainObjects: rawTargetDomainObjects,
          domainObject: toRaw(this.domainObject),
          annotationType: toRaw(this.annotationType),
          tags: [newTag]
        };
        existingAnnotation = await this.openmct.annotation.create(annotationCreationArguments);
      } else if (existingAnnotation._deleted) {
        this.openmct.annotation.unDeleteAnnotation(existingAnnotation);
      }

      this.userAddingTag = false;
      document.body.removeEventListener('click', this.tagCanceled);

      this.$emit('tags-updated', existingAnnotation);
      if (this.onTagChange) {
        this.onTagChange([existingAnnotation]);
      }
    }
  }
};
</script>
