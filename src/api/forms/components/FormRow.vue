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
  <div class="form-row c-form__row" :class="[{ first: first }, cssClass]" @onChange="onChange">
    <label class="c-form-row__label" :title="row.description" :for="`form-${row.key}`">
      {{ row.name }}
    </label>
    <div class="c-form-row__state-indicator" :class="reqClass"></div>
    <div v-if="row.control" ref="rowElement" class="c-form-row__controls"></div>
  </div>
</template>

<script>
export default {
  name: 'FormRow',
  components: {},
  inject: ['openmct'],
  props: {
    cssClass: {
      type: String,
      default: '',
      required: true
    },
    first: {
      type: Boolean,
      default: false,
      required: true
    },
    row: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      formControl: this.openmct.forms.getFormControl(this.row.control),
      valid: undefined,
      visited: false
    };
  },
  computed: {
    reqClass() {
      let reqClass = 'req';

      if (!this.row.required) {
        return;
      }

      if (this.visited && this.valid !== undefined) {
        if (this.valid === true) {
          reqClass = 'valid';
        } else {
          reqClass = 'invalid';
        }
      }

      return reqClass;
    }
  },
  mounted() {
    if (this.row.required) {
      const data = {
        model: this.row,
        value: this.row.value
      };

      this.onChange(data, false);
    }

    this.formControl.show(this.$refs.rowElement, this.row, this.onChange);
  },
  unmounted() {
    const destroy = this.formControl.destroy;
    if (destroy) {
      destroy();
    }
  },
  methods: {
    onChange(data, visited = true) {
      this.visited = visited;
      this.valid = this.validateRow(data);
      data.invalid = !this.valid;

      this.$emit('onChange', data);
    },
    validateRow(data) {
      let valid = true;
      if (this.row.required) {
        valid = data.value !== undefined && data.value !== null && data.value !== '';
      }

      if (this.row.required && !valid) {
        return false;
      }

      const pattern = data.model.pattern;
      if (valid && pattern) {
        const regex = new RegExp(pattern);
        valid = regex.test(data.value);
      }

      const validate = data.model.validate;
      if (valid && validate) {
        valid = validate(data);
      }

      return Boolean(valid);
    }
  }
};
</script>
