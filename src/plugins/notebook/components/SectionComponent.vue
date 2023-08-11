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
  <div
    class="c-list__item js-list__item"
    :class="[{ 'is-selected': isSelected, 'is-notebook-default': defaultSectionId === section.id }]"
    :data-id="section.id"
    @click="selectSection"
  >
    <span
      class="c-list__item__name js-list__item__name"
      :class="[{ 'c-input-inline': isSelected && !section.isLocked }]"
      :data-id="section.id"
      :contenteditable="isSelected && !section.isLocked"
      @keydown.escape="updateName"
      @keydown.enter="updateName"
      @blur="updateName"
      >{{ sectionName }}</span
    >
    <PopupMenu v-if="!section.isLocked" :popup-menu-items="popupMenuItems" />
  </div>
</template>

<script>
import { KEY_ENTER, KEY_ESCAPE } from '../utils/notebook-key-code';
import RemoveDialog from '../utils/removeDialog';
import PopupMenu from './PopupMenu.vue';

export default {
  components: {
    PopupMenu
  },
  inject: ['openmct'],
  props: {
    defaultSectionId: {
      type: String,
      default() {
        return '';
      }
    },
    selectedSectionId: {
      type: String,
      required: true
    },
    section: {
      type: Object,
      required: true
    },
    sectionTitle: {
      type: String,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      popupMenuItems: [],
      removeActionString: `Delete ${this.sectionTitle}`
    };
  },
  computed: {
    isSelected() {
      return this.selectedSectionId === this.section.id;
    },
    sectionName() {
      return this.section.name.length ? this.section.name : `Unnamed ${this.sectionTitle}`;
    }
  },
  mounted() {
    this.addPopupMenuItems();
  },
  methods: {
    addPopupMenuItems() {
      const removeSection = {
        cssClass: 'icon-trash',
        name: this.removeActionString,
        onItemClicked: this.getRemoveDialog
      };

      this.popupMenuItems = [removeSection];
    },
    deleteSection(success) {
      if (!success) {
        return;
      }

      this.$emit('deleteSection', this.section.id);
    },
    getRemoveDialog() {
      const message =
        'Other users may be editing entries in this section, and deleting it is permanent. Do you want to continue?';
      const options = {
        name: this.removeActionString,
        callback: this.deleteSection.bind(this),
        message
      };

      const removeDialog = new RemoveDialog(this.openmct, options);
      removeDialog.show();
    },
    selectSection(event) {
      const {
        target: {
          dataset: { id }
        }
      } = event;

      if (this.isSelected || !id) {
        return;
      }

      this.$emit('selectSection', id);
    },
    renameSection(target) {
      if (!target) {
        return;
      }

      target.textContent = target.textContent
        ? target.textContent.trim()
        : `Unnamed ${this.sectionTitle}`;

      if (this.section.name === target.textContent) {
        return;
      }

      this.$emit('renameSection', Object.assign(this.section, { name: target.textContent }));
    },
    updateName(event) {
      const { target, keyCode, type } = event;

      if (keyCode === KEY_ESCAPE) {
        target.textContent = this.section.name;
      } else if (keyCode === KEY_ENTER || type === 'blur') {
        this.renameSection(target);
      }

      target.scrollLeft = '0';

      target.blur();
    }
  }
};
</script>
