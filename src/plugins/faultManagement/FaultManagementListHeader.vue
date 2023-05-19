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
  <div class="c-fault-mgmt-item-header c-fault-mgmt__list-header c-fault-mgmt__list">
    <div class="c-fault-mgmt-item-header c-fault-mgmt__checkbox">
      <input type="checkbox" :checked="isSelectAll" @input="selectAll" />
    </div>
    <div
      class="c-fault-mgmt-item-header c-fault-mgmt__list-header-results c-fault-mgmt__list-severity"
    >
      {{ totalFaultsCount }} Results
    </div>
    <div class="c-fault-mgmt__list-header-content">
      <div class="c-fault-mgmt__list-content-right">
        <div class="c-fault-mgmt-item-header c-fault-mgmt__list-header-tripVal">Trip Value</div>
        <div class="c-fault-mgmt-item-header c-fault-mgmt__list-header-liveVal">Live Value</div>
        <div class="c-fault-mgmt-item-header c-fault-mgmt__list-header-trigTime">Trigger Time</div>
      </div>
    </div>
    <div class="c-fault-mgmt-item-header c-fault-mgmt__list-header-action-wrapper">
      <div class="c-fault-mgmt__list-header-sortButton c-fault-mgmt__list-action-button">
        <SelectField
          class="c-fault-mgmt-viewButton"
          title="Sort By"
          :model="model"
          @onChange="onChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SelectField from '@/api/forms/components/controls/SelectField.vue';

import { SORT_ITEMS } from './constants';

export default {
  components: {
    SelectField
  },
  inject: ['openmct', 'domainObject'],
  props: {
    selectedFaults: {
      type: Array,
      default() {
        return [];
      }
    },
    totalFaultsCount: {
      type: Number,
      default() {
        return 0;
      }
    }
  },
  data() {
    return {
      model: {}
    };
  },
  computed: {
    isSelectAll() {
      return this.totalFaultsCount > 0 && this.selectedFaults.length === this.totalFaultsCount;
    }
  },
  beforeMount() {
    const options = Object.values(SORT_ITEMS);
    this.model = {
      options,
      value: options[0].value
    };
  },
  methods: {
    onChange(data) {
      this.$emit('sortChanged', data);
    },
    selectAll(e) {
      this.$emit('selectAll', e.target.checked);
    }
  }
};
</script>
