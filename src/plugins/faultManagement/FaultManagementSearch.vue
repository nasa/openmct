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
  <div class="c-fault-mgmt__search-row">
    <Search
      class="c-fault-mgmt-search"
      :value="searchTerm"
      @input="updateSearchTerm"
      @clear="updateSearchTerm"
    />

    <SelectField
      class="c-fault-mgmt-viewButton"
      title="View Filter"
      :model="model"
      @onChange="onChange"
    />
  </div>
</template>

<script>
import SelectField from '@/api/forms/components/controls/SelectField.vue';
import Search from '@/ui/components/search.vue';

import { FILTER_ITEMS } from './constants';

export default {
  components: {
    SelectField,
    Search
  },
  inject: ['openmct', 'domainObject'],
  props: {
    searchTerm: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      items: []
    };
  },
  computed: {
    model() {
      return {
        options: this.items,
        value: this.items[0] ? this.items[0].value : FILTER_ITEMS[0].toLowerCase()
      };
    }
  },
  mounted() {
    this.items = FILTER_ITEMS.map((item) => {
      return {
        name: item,
        value: item.toLowerCase()
      };
    });
  },
  methods: {
    onChange(data) {
      this.$emit('filterChanged', data);
    },
    updateSearchTerm(searchTerm) {
      this.$emit('updateSearchTerm', searchTerm);
    }
  }
};
</script>
