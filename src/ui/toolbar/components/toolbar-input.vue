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
  <div class="c-labeled-input" :title="options.title">
    <label :for="uid">
      <div class="c-labeled-input__label">{{ options.label }}</div>
    </label>
    <input :id="uid" :type="options.type" :value="options.value" v-bind="options.attrs" />
  </div>
</template>

<script>
let inputUniqueId = 100;

export default {
  props: {
    options: {
      type: Object,
      required: true,
      validator(value) {
        return ['number', 'text'].indexOf(value.type) !== -1;
      }
    }
  },
  data() {
    inputUniqueId++;

    return {
      uid: `mct-input-id-${inputUniqueId}`
    };
  },
  mounted() {
    if (this.options.type === 'number') {
      this.$el.addEventListener('input', this.onInput);
    } else {
      this.$el.addEventListener('change', this.onChange);
    }
  },
  beforeDestroy() {
    if (this.options.type === 'number') {
      this.$el.removeEventListener('input', this.onInput);
    } else {
      this.$el.removeEventListener('change', this.onChange);
    }
  },
  methods: {
    onChange(event) {
      this.$emit('change', event.target.value, this.options);
    },
    onInput(event) {
      this.$emit('change', event.target.valueAsNumber, this.options);
    }
  }
};
</script>
