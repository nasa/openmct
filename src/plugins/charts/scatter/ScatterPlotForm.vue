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
  <span class="form-control">
    <span class="field control" :class="model.cssClass">
      <div class="c-form--sub-grid">
        <div class="c-form__row">
          <span class="req-indicator" :class="{ req: isRequired }"> </span>
          <label>Minimum X axis value</label>
          <input
            ref="domainMin"
            v-model.number="domainMin"
            data-field-name="domainMin"
            type="number"
            @input="onChange('domainMin')"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator" :class="{ req: isRequired }"> </span>
          <label>Maximum X axis value</label>
          <input
            ref="domainMax"
            v-model.number="domainMax"
            data-field-name="domainMax"
            type="number"
            @input="onChange('domainMax')"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator" :class="{ req: isRequired }"> </span>
          <label>Minimum Y axis value</label>
          <input
            ref="rangeMin"
            v-model.number="rangeMin"
            data-field-name="rangeMin"
            type="number"
            @input="onChange('rangeMin')"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator" :class="{ req: isRequired }"> </span>
          <label>Maximum Y axis value</label>
          <input
            ref="rangeMax"
            v-model.number="rangeMax"
            data-field-name="rangeMax"
            type="number"
            @input="onChange('rangeMax')"
          />
        </div>
      </div>
    </span>
  </span>
</template>

<script>
export default {
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rangeMax: this.model.value.rangeMax,
      rangeMin: this.model.value.rangeMin,
      domainMax: this.model.value.domainMax,
      domainMin: this.model.value.domainMin
    };
  },
  computed: {
    isRequired() {
      return [this.rangeMax, this.rangeMin, this.domainMin, this.domainMax].some(
        (value) => value !== undefined && value !== ''
      );
    }
  },
  methods: {
    onChange(property) {
      if (this[property] === '') {
        this[property] = undefined;
      }

      const data = {
        model: this.model,
        value: {
          rangeMax: this.rangeMax,
          rangeMin: this.rangeMin,
          domainMax: this.domainMax,
          domainMin: this.domainMin
        }
      };

      if (property) {
        this.model.validate(data);
      }

      this.$emit('onChange', data);
    }
  }
};
</script>
