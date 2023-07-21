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
  <div class="c-inspect-properties__section c-filter-settings">
    <li
      v-for="(filter, index) in filterField.filters"
      :key="index"
      class="c-inspect-properties__row c-filter-settings__setting"
    >
      <div class="c-inspect-properties__label label" :disabled="useGlobal">
        {{ filterField.name }} =
      </div>
      <div class="c-inspect-properties__value value">
        <!-- EDITING -->
        <!-- String input, editing -->
        <template v-if="!filter.possibleValues && isEditing">
          <input
            :id="`${filter}filterControl`"
            class="c-input--flex"
            type="text"
            :aria-label="label"
            :disabled="useGlobal"
            :value="persistedValue(filter)"
            @change="updateFilterValueFromString($event, filter)"
          />
        </template>

        <!-- Dropdown, editing -->
        <template v-if="filter.possibleValues && filter.singleSelectionThreshold && isEditing">
          <select
            name="setSelectionThreshold"
            :aria-label="label"
            :disabled="useGlobal"
            @change="updateFilterValueFromDropdown($event, filter.comparator, $event.target.value)"
          >
            <option key="NONE" value="NONE" selected="isSelected(filter.comparator, option.value)">
              None
            </option>
            <option
              v-for="option in filter.possibleValues"
              :key="option.label"
              :value="option.value"
              :selected="isSelected(filter.comparator, option.value)"
            >
              {{ option.label }}
            </option>
          </select>
        </template>

        <!-- Checkbox list, editing -->
        <template v-if="filter.possibleValues && isEditing && !filter.singleSelectionThreshold">
          <div
            v-for="option in filter.possibleValues"
            :key="option.value"
            class="c-checkbox-list__row"
          >
            <input
              :id="`${option.value}filterControl`"
              class="c-checkbox-list__input"
              type="checkbox"
              :aria-label="label"
              :disabled="useGlobal"
              :checked="isSelected(filter.comparator, option.value)"
              @change="updateFilterValueFromCheckbox($event, filter.comparator, option.value)"
            />
            <span class="c-checkbox-list__value">
              {{ option.label }}
            </span>
          </div>
        </template>

        <!-- BROWSING -->
        <!-- String input, NOT editing -->
        <template v-if="!filter.possibleValues && !isEditing">
          {{ persistedValue(filter) }}
        </template>

        <!-- Checkbox list, NOT editing -->
        <template v-if="filter.possibleValues && !isEditing">
          <span v-if="persistedFilters[filter.comparator]">
            {{ getFilterLabels(filter) }}
          </span>
        </template>
      </div>
    </li>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    filterField: {
      type: Object,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    useGlobal: Boolean,
    persistedFilters: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      isEditing: this.openmct.editor.isEditing()
    };
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleIsEditing);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.toggleIsEditing);
  },
  methods: {
    toggleIsEditing(isEditing) {
      this.isEditing = isEditing;
    },
    isSelected(comparator, value) {
      if (this.persistedFilters[comparator] && this.persistedFilters[comparator].includes(value)) {
        return true;
      } else {
        return false;
      }
    },
    persistedValue(comparator) {
      return this.persistedFilters && this.persistedFilters[comparator];
    },
    updateFilterValueFromString(event, comparator) {
      this.$emit('filterTextValueChanged', this.filterField.key, comparator, event.target.value);
    },
    updateFilterValueFromCheckbox(event, comparator, value) {
      this.$emit('filterSelected', this.filterField.key, comparator, value, event.target.checked);
    },
    updateFilterValueFromDropdown(event, comparator, value) {
      if (value === 'NONE') {
        this.$emit('clearFilters', this.filterField.key);
      } else {
        this.$emit('filterSingleSelected', this.filterField.key, comparator, value);
      }
    },
    getFilterLabels(filter) {
      return this.persistedFilters[filter.comparator]
        .reduce((accum, filterValue) => {
          accum.push(
            filter.possibleValues.reduce((label, possibleValue) => {
              if (filterValue === possibleValue.value) {
                label = possibleValue.label;
              }

              return label;
            }, '')
          );

          return accum;
        }, [])
        .join(', ');
    }
  }
};
</script>
