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
  <div class="c-ctrl-wrapper">
    <div
      class="c-icon-button"
      :title="nextValue.title"
      :class="[nextValue.icon, { 'c-icon-button--mixed': nonSpecific }]"
      @click="cycle"
    >
      <div v-if="nextValue.label" class="c-icon-button__label">
        {{ nextValue.label }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  computed: {
    nextValue() {
      let currentValue = this.options.options.filter((v) => this.options.value === v.value)[0];
      let nextIndex = this.options.options.indexOf(currentValue) + 1;
      if (nextIndex >= this.options.options.length) {
        nextIndex = 0;
      }

      return this.options.options[nextIndex];
    },
    nonSpecific() {
      return this.options.nonSpecific === true;
    }
  },
  methods: {
    cycle() {
      if (this.options.isEditing === undefined || this.options.isEditing) {
        this.$emit('change', this.nextValue.value, this.options);
      }
    }
  }
};
</script>
