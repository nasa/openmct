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
  <expanded-view-item
    v-for="item in sortedItems"
    :key="item.key"
    :item="item"
    :item-properties="itemProperties"
  >
  </expanded-view-item>
</template>

<script>
import _ from 'lodash';

import ExpandedViewItem from './ExpandedViewItem.vue';

export default {
  components: { ExpandedViewItem },
  inject: ['domainObject', 'openmct'],
  props: {
    headerItems: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    defaultSort: {
      type: Object,
      default() {
        return {
          property: '',
          defaultDirection: true
        };
      }
    }
  },
  data() {
    let sortBy = this.defaultSort.property;
    let ascending = this.defaultSort.defaultDirection;

    return {
      sortBy,
      ascending
    };
  },
  computed: {
    sortedItems() {
      let sortedItems = _.sortBy(this.items, this.sortBy);
      if (!this.ascending) {
        sortedItems = sortedItems.reverse();
      }

      return sortedItems;
    },
    itemProperties() {
      return this.headerItems.map((headerItem) => {
        return {
          property: headerItem.property,
          format: headerItem.format
        };
      });
    }
  },
  watch: {
    defaultSort: {
      handler() {
        this.setSort();
      },
      deep: true
    }
  },
  methods: {
    setSort() {
      this.sortBy = this.defaultSort.property;
      this.ascending = this.defaultSort.defaultDirection;
    },
    sort(data) {
      const property = data.property;
      const direction = data.direction;

      if (this.sortBy === property) {
        this.ascending = !this.ascending;
      } else {
        this.sortBy = property;
        this.ascending = direction;
      }
    }
  }
};
</script>
