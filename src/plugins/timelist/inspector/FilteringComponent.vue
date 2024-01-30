<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
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
  <li class="c-inspect-properties__row">
    <div v-if="canEdit" class="c-inspect-properties__hint span-all">
      Filter this view by comma-separated keywords. Filtering uses an 'OR' method.
    </div>
    <div class="c-inspect-properties__label" aria-label="Activity Names" title="Filter by keyword.">
      Activity Names
    </div>
    <div
      v-if="canEdit"
      class="c-inspect-properties__value"
      :class="{ 'form-error': hasFilterError }"
    >
      <textarea
        v-model="filterValue"
        class="c-input--flex"
        type="text"
        @keydown.enter.exact.stop="forceBlur($event)"
        @keyup="updateNameFilter($event, 'filter')"
      ></textarea>
    </div>
    <div v-else class="c-inspect-properties__value">
      <template v-if="filterValue && filterValue.length > 0">
        {{ filterValue }}
      </template>
      <template v-else> No filters applied </template>
    </div>
  </li>
  <li class="c-inspect-properties__row">
    <div
      class="c-inspect-properties__label"
      aria-label="Meta-data Properties"
      title="Filter by keyword."
    >
      Meta-data Properties
    </div>
    <div
      v-if="canEdit"
      class="c-inspect-properties__value"
      :class="{ 'form-error': hasMetadataFilterError }"
    >
      <textarea
        v-model="filterMetadataValue"
        class="c-input--flex"
        type="text"
        @keydown.enter.exact.stop="forceBlur($event)"
        @keyup="updateMetadataFilter($event, 'filterMetadata')"
      ></textarea>
    </div>
    <div v-else class="c-inspect-properties__value">
      <template v-if="filterMetadataValue && filterMetadataValue.length > 0">
        {{ filterMetadataValue }}
      </template>
      <template v-else> No filters applied </template>
    </div>
  </li>
</template>

<script>
export default {
  inject: ['openmct', 'domainObject'],
  emits: ['updated'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing(),
      filterValue: this.domainObject.configuration.filter,
      filterMetadataValue: this.domainObject.configuration.filterMetadata,
      hasFilterError: false,
      hasMetadataFilterError: false
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
      if (!this.isEditing) {
        if (this.hasFilterError) {
          this.filterValue = this.domainObject.configuration.filter;
        }
        if (this.hasMetadataFilterError) {
          this.filterMetadataValue = this.domainObject.configuration.filterMetadata;
        }
        this.hasFilterError = false;
        this.hasMetadataFilterError = false;
      }
    },
    forceBlur(event) {
      event.target.blur();
    },
    updateNameFilter(event, property) {
      if (!this.isValid(this.filterValue)) {
        this.hasFilterError = true;

        return;
      }
      this.hasFilterError = false;

      this.$emit('updated', {
        property,
        value: this.filterValue.replace(/,(\s)*$/, '')
      });
    },
    updateMetadataFilter(event, property) {
      if (!this.isValid(this.filterMetadataValue)) {
        this.hasMetadataFilterError = true;

        return;
      }
      this.hasMetadataFilterError = false;

      this.$emit('updated', {
        property,
        value: this.filterMetadataValue.replace(/,(\s)*$/, '')
      });
    },
    isValid(value) {
      // Test for any word character, any whitespace character or comma
      if (value === '') {
        return true;
      }

      const regex = new RegExp(/^([a-zA-Z0-9_\-\s,])+$/g);

      return regex.test(value);
    }
  }
};
</script>
