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
  <div class="c-search" v-bind="$attrs" :class="{ 'is-active': active }">
    <input
      class="c-search__input"
      aria-label="Search Input"
      tabindex="0"
      type="search"
      :value="value"
      v-bind="$attrs"
      @click="() => $emit('click')"
      @input="($event) => $emit('input', $event.target.value)"
    />
    <a v-if="value" class="c-search__clear-input icon-x-in-circle" @click="clearInput"></a>
    <slot></slot>
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['input', 'clear', 'click'],
  data() {
    return {
      active: false
    };
  },
  watch: {
    value(inputValue) {
      this.active = inputValue.length > 0;
    }
  },
  methods: {
    clearInput() {
      // Clear the user's input and set 'active' to false
      this.$emit('clear', '');
      this.active = false;
    }
  }
};
</script>
