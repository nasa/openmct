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
  <ul class="c-list c-notebook__sections">
    <li v-for="section in sections" :key="section.id" class="c-list__item-h">
      <NotebookSection
        ref="sectionComponent"
        :default-section-id="defaultSectionId"
        :selected-section-id="selectedSectionId"
        :section="section"
        :section-title="sectionTitle"
        @deleteSection="deleteSection"
        @renameSection="updateSection"
        @selectSection="selectSection"
      />
    </li>
  </ul>
</template>

<script>
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook } from '../utils/notebook-storage';
import SectionComponent from './SectionComponent.vue';

export default {
  components: {
    NotebookSection: SectionComponent
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
    domainObject: {
      type: Object,
      default() {
        return {};
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
    }
  },
  watch: {
    sections() {
      if (!this.containsSection(this.selectedSectionId)) {
        this.selectSection(this.sections[0].id);
      }
    }
  },
  methods: {
    containsSection(sectionId) {
      return this.sections.some((section) => section.id === sectionId);
    },
    deleteSection(id) {
      const section = this.sections.find((s) => s.id === id);
      deleteNotebookEntries(this.openmct, this.domainObject, section);

      const selectedSection = this.sections.find((s) => s.id === this.selectedSectionId);
      const defaultNotebook = getDefaultNotebook();
      const defaultSectionId = defaultNotebook && defaultNotebook.defaultSectionId;
      const isSectionSelected = selectedSection && selectedSection.id === id;
      const isSectionDefault = defaultSectionId === id;
      const sections = this.sections.filter((s) => s.id !== id);

      if (isSectionSelected && defaultSectionId) {
        sections.forEach((s) => {
          s.isSelected = false;
          if (defaultSectionId === s.id) {
            s.isSelected = true;
          }
        });
      }

      if (isSectionDefault) {
        this.$emit('defaultSectionDeleted');
      }

      if (sections.length && isSectionSelected && (!defaultSectionId || isSectionDefault)) {
        sections[0].isSelected = true;
      }

      this.$emit('updateSection', {
        sections,
        id
      });
    },
    selectSection(id) {
      this.$emit('selectSection', id);
    },
    updateSection(newSection) {
      const id = newSection.id;
      const sections = this.sections.map((section) => (section.id === id ? newSection : section));
      this.$emit('updateSection', {
        sections,
        id
      });
    }
  }
};
</script>
