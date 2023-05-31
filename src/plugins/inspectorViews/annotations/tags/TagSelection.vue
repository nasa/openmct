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
  <div class="w-tag-wrapper has-tag-applier">
    <template v-if="newTag">
      <AutoCompleteField
        v-if="newTag"
        ref="tagSelection"
        :model="availableTagModel"
        :place-holder-text="'Type to select tag'"
        class="c-tag-selection"
        :item-css-class="'icon-circle'"
        @onChange="tagSelected"
      />
    </template>
    <template v-else>
      <div
        class="c-tag"
        :class="{ 'c-tag-edit': !readOnly }"
        :style="{ background: selectedBackgroundColor, color: selectedForegroundColor }"
      >
        <button
          v-show="!readOnly"
          class="c-completed-tag-deletion c-tag__remove-btn icon-x-in-circle"
          :style="{ textShadow: selectedBackgroundColor + ' 0 0 4px' }"
          :aria-label="`Remove tag ${selectedTagLabel}`"
          @click="removeTag"
        ></button>
        <div class="c-tag__label" aria-label="Tag">{{ selectedTagLabel }}</div>
      </div>
    </template>
  </div>
</template>

<script>
import AutoCompleteField from '../../../../api/forms/components/controls/AutoCompleteField.vue';

export default {
  components: {
    AutoCompleteField
  },
  inject: ['openmct'],
  props: {
    addedTags: {
      type: Array,
      default() {
        return [];
      }
    },
    selectedTag: {
      type: String,
      default() {
        return '';
      }
    },
    newTag: {
      type: Boolean,
      default() {
        return false;
      }
    },
    readOnly: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    return {};
  },
  computed: {
    availableTagModel() {
      const availableTags = this.openmct.annotation
        .getAvailableTags()
        .filter((tag) => {
          return !this.addedTags.includes(tag.id);
        })
        .map((tag) => {
          return {
            name: tag.label,
            color: tag.backgroundColor,
            id: tag.id
          };
        });

      return {
        options: availableTags
      };
    },
    selectedBackgroundColor() {
      const selectedTag = this.getAvailableTagByID(this.selectedTag);
      if (selectedTag) {
        return selectedTag.backgroundColor;
      } else {
        // missing available tag color, use default
        return '#00000';
      }
    },
    selectedForegroundColor() {
      const selectedTag = this.getAvailableTagByID(this.selectedTag);
      if (selectedTag) {
        return selectedTag.foregroundColor;
      } else {
        // missing available tag color, use default
        return '#FFFFF';
      }
    },
    selectedTagLabel() {
      const selectedTag = this.getAvailableTagByID(this.selectedTag);
      if (selectedTag) {
        return selectedTag.label;
      } else {
        // missing available tag color, use default
        return '¡UNKNOWN!';
      }
    }
  },
  mounted() {},
  methods: {
    getAvailableTagByID(tagID) {
      return this.openmct.annotation.getAvailableTags().find((tag) => {
        return tag.id === tagID;
      });
    },
    removeTag() {
      this.$emit('tagRemoved', this.selectedTag);
    },
    tagSelected(autoField) {
      const tagAdded = autoField.model.options.find((option) => {
        if (option.name === autoField.value) {
          return true;
        }

        return false;
      });
      if (tagAdded) {
        this.$emit('tagAdded', tagAdded.id);
      }
    }
  }
};
</script>
