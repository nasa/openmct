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
  <span class="form-control shell">
    <span class="field control" :class="model.cssClass">
      <textarea
        :id="`${model.key}-textarea`"
        v-model="field"
        type="text"
        :size="model.size"
        @input="updateText()"
      >
      </textarea>
    </span>
  </span>
</template>

<script>
import { throttle } from 'lodash';

export default {
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      field: this.model.value
    };
  },
  mounted() {
    this.updateText = throttle(this.updateText.bind(this), 500);
  },
  methods: {
    updateText() {
      const data = {
        model: this.model,
        value: this.field
      };

      this.$emit('onChange', data);
    }
  }
};
</script>
