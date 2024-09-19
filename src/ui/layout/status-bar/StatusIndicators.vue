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
  <div ref="indicators" class="l-shell__head-section l-shell__indicators">
    <component
      :is="indicator.value.vueComponent"
      v-for="indicator in sortedIndicators"
      :key="indicator.value.key"
      role="status"
    />
  </div>
</template>

<script>
import { shallowRef } from 'vue';

export default {
  inject: ['openmct'],
  props: {
    contentUpdated: {
      type: String,
      required: true
    },
    listenForOverflow: {
      type: Boolean,
      required: false,
      default() {
        return false;
      }
    }
  },
  emits: ['indicators-overflowing'],
  data() {
    return {
      indicators: this.openmct.indicators.getIndicatorObjectsByPriority().map(shallowRef)
    };
  },
  computed: {
    sortedIndicators() {
      if (this.indicators.length === 0) {
        return [];
      }

      return [...this.indicators].sort((a, b) => b.value.priority - a.value.priority);
    }
  },
  watch: {
    contentUpdated() {
      // console.log('content updated');
      // this.checkOverflow();
    }
  },
  mounted() {
    if (this.listenForOverflow) {
      window.addEventListener('load', this.checkOverflow);
      window.addEventListener('resize', this.checkOverflow);
    }
  },
  beforeUnmount() {
    this.openmct.indicators.off('addIndicator', this.addIndicator);
    if (this.listenForOverflow) {
      window.removeEventListener('load', this.checkOverflow);
      window.removeEventListener('resize', this.checkOverflow);
    }
  },
  updated() {
    // console.log('updated');
    if (this.listenForOverflow) {
      window.addEventListener('resize', this.checkOverflow);
      this.checkOverflow();
    } else {
      window.removeEventListener('resize', this.checkOverflow);
      this.checkOverflow();
    }
  },
  created() {
    this.openmct.indicators.on('addIndicator', this.addIndicator);
  },
  methods: {
    addIndicator(indicator) {
      this.indicators.push(shallowRef(indicator));
    },
    checkOverflow() {
      const element = this.$refs.indicators;
      this.$emit('indicators-overflowing', element.scrollWidth > element.clientWidth);
    }
  }
};
</script>
