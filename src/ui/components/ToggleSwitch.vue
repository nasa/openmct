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
  <div class="c-toggle-switch">
    <label class="c-toggle-switch__control">
      <input :id="id" type="checkbox" :checked="checked" @change="onUserSelect($event)" />
      <span class="c-toggle-switch__slider" role="switch" :aria-label="name"></span>
    </label>
    <div v-if="label && label.length" class="c-toggle-switch__label">
      {{ label }}
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: false,
      default: ''
    },
    name: {
      type: String,
      required: false,
      default: ''
    },
    checked: Boolean
  },
  methods: {
    onUserSelect(event) {
      this.$emit('change', event.target.checked);
    }
  }
};
</script>
