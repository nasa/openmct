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
  <div class="c-custom-checkbox">
    <input
      :id="uid"
      type="checkbox"
      :name="options.name"
      :checked="options.value"
      :disabled="options.disabled"
      @change="onChange"
    />

    <label :for="uid">
      <div class="c-custom-checkbox__box"></div>
      <div class="c-custom-checkbox__label-text">
        {{ options.name }}
      </div>
    </label>
  </div>
</template>

<script>
let uniqueId = 100;

export default {
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  emits: ['change'],
  data() {
    uniqueId++;

    return {
      uid: `mct-checkbox-id-${uniqueId}`
    };
  },
  methods: {
    onChange(event) {
      this.$emit('change', event.target.checked, { ...this.options });
    }
  }
};
</script>
