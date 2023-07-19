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
    :class="[
      {
        'is-selected': isSelected,
        'is-notebook-default': defaultPageId === page.id,
        'icon-lock': page.isLocked
      }
    ]"
    :data-id="page.id"
    @click="selectPage"
  >
    <template v-if="!page.isLocked">
      <div
        class="c-list__item__name js-list__item__name"
        :class="[{ 'c-input-inline': isSelected }]"
        :data-id="page.id"
        :contenteditable="isSelected"
        @keydown.escape="updateName"
        @keydown.enter="updateName"
        @blur="updateName"
      >
        {{ pageName }}
      </div>
      <PopupMenu :popup-menu-items="popupMenuItems" />
    </template>
    <template v-else>
      <div
        class="c-list__item__name js-list__item__name"
        :data-id="page.id"
        :contenteditable="false"
      >
        {{ pageName }}
      </div>
    </template>
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
    defaultPageId: {
      type: String,
      default() {
        return '';
      }
    },
    selectedPageId: {
      type: String,
      required: true
    },
    page: {
      type: Object,
      required: true
    },
    pageTitle: {
      type: String,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      popupMenuItems: [],
      removeActionString: `Delete ${this.pageTitle}`
    };
  },
  computed: {
    isSelected() {
      return this.selectedPageId === this.page.id;
    },
    pageName() {
      return this.page.name.length ? this.page.name : `Unnamed ${this.pageTitle}`;
    }
  },
  mounted() {
    this.addPopupMenuItems();
  },
  methods: {
    addPopupMenuItems() {
      const removePage = {
        cssClass: 'icon-trash',
        name: this.removeActionString,
        onItemClicked: this.getRemoveDialog.bind(this)
      };

      this.popupMenuItems = [removePage];
    },
    deletePage(success) {
      if (!success) {
        return;
      }

      this.$emit('deletePage', this.page.id);
    },
    getRemoveDialog() {
      const message =
        'Other users may be editing entries in this page, and deleting it is permanent. Do you want to continue?';
      const options = {
        name: this.removeActionString,
        callback: this.deletePage.bind(this),
        message
      };
      const removeDialog = new RemoveDialog(this.openmct, options);
      removeDialog.show();
    },
    selectPage(event) {
      const {
        target: {
          dataset: { id }
        }
      } = event;

      if (this.isSelected || !id) {
        return;
      }

      this.$emit('selectPage', id);
    },
    renamePage(target) {
      if (!target) {
        return;
      }

      target.textContent = target.textContent
        ? target.textContent.trim()
        : `Unnamed ${this.pageTitle}`;

      if (this.page.name === target.textContent) {
        return;
      }

      this.$emit('renamePage', Object.assign(this.page, { name: target.textContent }));
    },
    updateName(event) {
      const { target, keyCode, type } = event;

      if (keyCode === KEY_ESCAPE) {
        target.textContent = this.page.name;
      } else if (keyCode === KEY_ENTER || type === 'blur') {
        this.renamePage(target);
      }

      target.scrollLeft = '0';

      target.blur();
    }
  }
};
</script>
