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
  <li class="c-inspect-properties__row">
    <div v-if="canEdit" class="c-inspect-properties__hint span-all">
      Filter this view by comma-separated keywords.
    </div>
    <div class="c-inspect-properties__label" title="Filter by keyword.">Filters</div>
    <div v-if="canEdit" class="c-inspect-properties__value" :class="{ 'form-error': hasError }">
      <textarea
        v-model="filterValue"
        class="c-input--flex"
        type="text"
        @keydown.enter.exact.stop="forceBlur($event)"
        @keyup="updateForm($event, 'filter')"
      ></textarea>
    </div>
    <div v-else class="c-inspect-properties__value">
      {{ filterValue }}
    </div>
  </li>
</template>

<script>
export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing(),
      filterValue: this.domainObject.configuration.filter,
      hasError: false
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
  beforeDestroy() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
      if (!this.isEditing && this.hasError) {
        this.filterValue = this.domainObject.configuration.filter;
        this.hasError = false;
      }
    },
    forceBlur(event) {
      event.target.blur();
    },
    updateForm(event, property) {
      if (!this.isValid()) {
        this.hasError = true;

        return;
      }

      this.hasError = false;

      this.$emit('updated', {
        property,
        value: this.filterValue.replace(/,(\s)*$/, '')
      });
    },
    isValid() {
      // Test for any word character, any whitespace character or comma
      if (this.filterValue === '') {
        return true;
      }

      const regex = new RegExp(/^([a-zA-Z0-9_\-\s,])+$/g);

      return regex.test(this.filterValue);
    }
  }
};
</script>
