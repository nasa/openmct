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
  <ul class="c-list c-notebook__pages">
    <li v-for="page in pages" :key="page.id" class="c-list__item-h">
      <Page
        ref="pageComponent"
        :default-page-id="defaultPageId"
        :selected-page-id="selectedPageId"
        :page="page"
        :page-title="pageTitle"
        @deletePage="deletePage"
        @renamePage="updatePage"
        @selectPage="selectPage"
      />
    </li>
  </ul>
</template>

<script>
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook } from '../utils/notebook-storage';
import Page from './PageComponent.vue';

export default {
  components: {
    Page
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
    domainObject: {
      type: Object,
      required: true
    },
    pages: {
      type: Array,
      required: true,
      default() {
        return [];
      }
    },
    sections: {
      type: Array,
      required: true,
      default() {
        return [];
      }
    },
    pageTitle: {
      type: String,
      default() {
        return '';
      }
    },
    sidebarCoversEntries: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  watch: {
    pages() {
      if (!this.containsPage(this.selectedPageId)) {
        this.selectPage(this.pages[0].id);
      }
    }
  },
  methods: {
    containsPage(pageId) {
      return this.pages.some((page) => page.id === pageId);
    },
    deletePage(id) {
      const selectedSection = this.sections.find((s) => s.isSelected);
      const page = this.pages.find((p) => p.id === id);
      deleteNotebookEntries(this.openmct, this.domainObject, selectedSection, page);

      const selectedPage = this.pages.find((p) => p.isSelected);
      const defaultNotebook = getDefaultNotebook();
      const defaultPageId = defaultNotebook && defaultNotebook.defaultPageId;
      const isPageSelected = selectedPage && selectedPage.id === id;
      const isPageDefault = defaultPageId === id;
      const pages = this.pages.filter((s) => s.id !== id);
      let selectedPageId;

      if (isPageSelected && defaultPageId) {
        pages.forEach((s) => {
          s.isSelected = false;
          if (defaultPageId === s.id) {
            selectedPageId = s.id;
          }
        });
      }

      if (isPageDefault) {
        this.$emit('defaultPageDeleted');
      }

      if (pages.length && isPageSelected && (!defaultPageId || isPageDefault)) {
        selectedPageId = pages[0].id;
      }

      this.$emit('updatePage', {
        pages,
        id
      });
      this.$emit('selectPage', selectedPageId);
    },
    selectPage(id) {
      this.$emit('selectPage', id);

      // Add test here for whether or not to toggle the nav
      if (this.sidebarCoversEntries) {
        this.$emit('toggleNav');
      }
    },
    updatePage(newPage) {
      const id = newPage.id;
      const pages = this.pages.map((page) => (page.id === id ? newPage : page));
      this.$emit('updatePage', {
        pages,
        id
      });
    }
  }
};
</script>
