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
  <div class="c-sidebar c-drawer c-drawer--align-left">
    <div class="c-sidebar__pane js-sidebar-sections">
      <div class="c-sidebar__header-w">
        <div class="c-sidebar__header">
          <span class="c-sidebar__header-label">{{ sectionTitle }}</span>
          <button
            class="c-icon-button c-icon-button--major icon-plus"
            aria-label="Add Section"
            @click="addSection"
          >
            <span class="c-list-button__label">Add</span>
          </button>
        </div>
      </div>
      <div class="c-sidebar__contents-and-controls">
        <SectionCollection
          class="c-sidebar__contents"
          :default-section-id="defaultSectionId"
          :selected-section-id="selectedSectionId"
          :domain-object="domainObject"
          :sections="sections"
          :section-title="sectionTitle"
          @defaultSectionDeleted="defaultSectionDeleted"
          @updateSection="sectionsChanged"
          @selectSection="selectSection"
        />
      </div>
    </div>
    <div class="c-sidebar__pane js-sidebar-pages">
      <div class="c-sidebar__header-w">
        <div class="c-sidebar__header">
          <span class="c-sidebar__header-label">{{ pageTitle }}</span>

          <button
            class="c-icon-button c-icon-button--major icon-plus"
            aria-label="Add Page"
            @click="addPage"
          >
            <span class="c-icon-button__label">Add</span>
          </button>
        </div>
      </div>

      <div class="c-sidebar__contents-and-controls">
        <PageCollection
          ref="pageCollection"
          class="c-sidebar__contents"
          :default-page-id="defaultPageId"
          :selected-page-id="selectedPageId"
          :domain-object="domainObject"
          :pages="pages"
          :sections="sections"
          :sidebar-covers-entries="sidebarCoversEntries"
          :page-title="pageTitle"
          @defaultPageDeleted="defaultPageDeleted"
          @toggleNav="toggleNav"
          @updatePage="pagesChanged"
          @selectPage="selectPage"
        />
      </div>
    </div>
    <div class="c-sidebar__right-edge">
      <button class="c-icon-button c-icon-button--major icon-line-horz" @click="toggleNav"></button>
    </div>
  </div>
</template>

<script>
import { v4 as uuid } from 'uuid';

import PageCollection from './PageCollection.vue';
import SectionCollection from './SectionCollection.vue';

export default {
  components: {
    SectionCollection,
    PageCollection
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
      default() {
        return '';
      }
    },
    defaultSectionId: {
      type: String,
      default() {
        return '';
      }
    },
    selectedSectionId: {
      type: String,
      default() {
        return '';
      }
    },
    domainObject: {
      type: Object,
      default() {
        return {};
      }
    },
    pageTitle: {
      type: String,
      default() {
        return '';
      }
    },
    sections: {
      type: Array,
      required: true,
      default() {
        return [];
      }
    },
    sectionTitle: {
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
  computed: {
    pages() {
      const selectedSection = this.sections.find(
        (section) => section.id === this.selectedSectionId
      );

      return (selectedSection && selectedSection.pages) || [];
    }
  },
  watch: {
    pages: {
      handler(newPages, oldPages) {
        if (!newPages.length) {
          this.addPage();
        }
      },
      deep: true
    },
    sections: {
      handler(newSections, oldSections) {
        if (!newSections.length) {
          this.addSection();
        }
      },
      deep: true
    }
  },
  mounted() {
    if (!this.sections.length) {
      this.addSection();
    }
  },
  methods: {
    addPage() {
      const newPage = this.createNewPage();
      const pages = this.addNewPage(newPage);

      this.pagesChanged({
        pages,
        id: newPage.id
      });
      this.$emit('selectPage', newPage.id);
    },
    addSection() {
      const newSection = this.createNewSection();
      const sections = this.addNewSection(newSection);

      this.sectionsChanged({
        sections,
        id: newSection.id
      });

      this.$emit('selectSection', newSection.id);
    },
    addNewPage(newPage) {
      this.pages.forEach((page) => {
        page.isSelected = false;
      });

      this.pages.push(newPage);
      return this.pages;
    },
    addNewSection(newSection) {
      this.sections.forEach((section) => {
        section.isSelected = false;
      });

      this.sections.push(newSection);
      return this.sections;
    },
    createNewPage() {
      const pageTitle = this.pageTitle;
      const id = uuid();

      return {
        id,
        isDefault: false,
        isSelected: true,
        name: `Unnamed ${pageTitle}`,
        pageTitle
      };
    },
    createNewSection() {
      const sectionTitle = this.sectionTitle;
      const id = uuid();
      const page = this.createNewPage();
      const pages = [page];

      return {
        id,
        isDefault: false,
        isSelected: true,
        name: `Unnamed ${sectionTitle}`,
        pages,
        sectionTitle
      };
    },
    defaultPageDeleted() {
      this.$emit('defaultPageDeleted');
    },
    defaultSectionDeleted() {
      this.$emit('defaultSectionDeleted');
    },
    toggleNav() {
      this.$emit('toggleNav');
    },
    pagesChanged({ pages, id }) {
      this.$emit('pagesChanged', {
        pages,
        id
      });
    },
    selectPage(pageId) {
      this.$emit('selectPage', pageId);
    },
    selectSection(sectionId) {
      this.$emit('selectSection', sectionId);
    },
    sectionsChanged({ sections, id }) {
      this.$emit('sectionsChanged', {
        sections,
        id
      });
    }
  }
};
</script>
