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
  <li class="c-tree__item-h">
    <div class="c-tree__item menus-to-left" @click="toggleExpanded">
      <div
        class="c-filter-tree-item__filter-indicator"
        :class="{ 'icon-filter': hasActiveGlobalFilters }"
      ></div>
      <span
        class="c-disclosure-triangle is-enabled flex-elem"
        :class="{ 'c-disclosure-triangle--expanded': expanded }"
      ></span>
      <div class="c-tree__item__label c-object-label">
        <div class="c-object-label">
          <div class="c-object-label__type-icon icon-gear"></div>
          <div class="c-object-label__name flex-elem grows">Global Filtering</div>
        </div>
      </div>
    </div>
    <ul v-if="expanded" class="c-inspect-properties">
      <filter-field
        v-for="metadatum in globalMetadata"
        :key="metadatum.key"
        :filter-field="metadatum"
        :persisted-filters="updatedFilters[metadatum.key]"
        label="Global Filter"
        @filterSelected="updateFiltersWithSelectedValue"
        @filterTextValueChanged="updateFiltersWithTextValue"
        @filterSingleSelected="updateSingleSelection"
        @clearFilters="clearFilters"
      />
    </ul>
  </li>
</template>

<script>
import FilterField from './FilterField.vue';

export default {
  components: {
    FilterField
  },
  inject: ['openmct'],
  props: {
    globalMetadata: {
      type: Object,
      required: true
    },
    globalFilters: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      expanded: false,
      updatedFilters: JSON.parse(JSON.stringify(this.globalFilters))
    };
  },
  computed: {
    hasActiveGlobalFilters() {
      return Object.values(this.globalFilters).some((field) => {
        return Object.values(field).some((comparator) => {
          return comparator && (comparator !== '' || comparator.length > 0);
        });
      });
    }
  },
  watch: {
    globalFilters: {
      handler: function checkFilters(newGlobalFilters) {
        this.updatedFilters = JSON.parse(JSON.stringify(newGlobalFilters));
      },
      deep: true
    }
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded;
    },
    clearFilters(key) {
      this.updatedFilters[key] = {};
      this.$emit('persistGlobalFilters', key, this.updatedFilters);
    },
    updateFiltersWithSelectedValue(key, comparator, valueName, value) {
      let filterValue = this.updatedFilters[key];

      if (filterValue[comparator]) {
        if (value === true) {
          filterValue[comparator].push(valueName);
        } else {
          if (filterValue[comparator].length === 1) {
            this.updatedFilters[key] = {};
          } else {
            filterValue[comparator] = filterValue[comparator].filter((v) => v !== valueName);
          }
        }
      } else {
        this.updatedFilters[key][comparator] = [valueName];
      }

      this.$emit('persistGlobalFilters', key, this.updatedFilters);
    },
    updateSingleSelection(key, comparator, value) {
      this.updatedFilters[key][comparator] = [value];
      this.$emit('persistGlobalFilters', key, this.updatedFilters);
    },
    updateFiltersWithTextValue(key, comparator, value) {
      if (value.trim() === '') {
        this.updatedFilters[key] = {};
      } else {
        this.updatedFilters[key][comparator] = value;
      }

      this.$emit('persistGlobalFilters', key, this.updatedFilters);
    }
  }
};
</script>
