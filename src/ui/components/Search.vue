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
  <div class="c-search" :class="{ 'is-active': active === true }">
    <input
      v-bind="$attrs"
      class="c-search__input"
      aria-label="Search Input"
      tabindex="10000"
      type="search"
      :value="value"
      v-on="inputListeners"
    />
    <a class="c-search__clear-input icon-x-in-circle" @click="clearInput"></a>
    <slot></slot>
  </div>
</template>

<script>
/* Emits input and clear events */
export default {
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      active: false
    };
  },
  computed: {
    inputListeners: function () {
      let vm = this;

      return Object.assign({}, this.$listeners, {
        input: function (event) {
          vm.$emit('input', event.target.value);
          vm.active = event.target.value.length > 0;
        }
      });
    }
  },
  watch: {
    value(inputValue) {
      if (!inputValue.length) {
        this.clearInput();
      }
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
