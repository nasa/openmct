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
  <div class="c-form-control--clock-display-format-fields">
    <SelectField v-for="item in items" :key="item.key" :model="item" @onChange="onChange" />
  </div>
</template>

<script>
import SelectField from '@/api/forms/components/controls/SelectField.vue';

export default {
  components: {
    SelectField
  },
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      items: []
    };
  },
  mounted() {
    const values = this.model.value || [];
    this.items = this.model.items.map((item, index) => {
      item.value = values[index];
      item.key = `${this.model.key}.${index}`;

      return item;
    });
  },
  methods: {
    onChange(data) {
      this.$emit('onChange', data);
    }
  }
};
</script>
