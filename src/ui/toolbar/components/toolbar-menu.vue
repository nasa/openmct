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
      class="c-icon-button c-icon-button--menu"
      :class="options.icon"
      :title="options.title"
      @click="toggle"
    >
      <div v-if="options.label" class="c-icon-button__label">
        {{ options.label }}
      </div>
    </div>
    <div v-if="open" class="c-menu">
      <ul>
        <li
          v-for="(option, index) in options.options"
          :key="index"
          :class="option.class"
          @click="onClick(option)"
        >
          {{ option.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import toggle from '../../mixins/toggle-mixin';
export default {
  mixins: [toggle],
  props: {
    options: {
      type: Object,
      required: true,
      validator(value) {
        // must pass valid options array.
        return Array.isArray(value.options) && value.options.every((o) => o.name);
      }
    }
  },
  methods: {
    onClick(option) {
      this.$emit('click', option);
    }
  }
};
</script>
