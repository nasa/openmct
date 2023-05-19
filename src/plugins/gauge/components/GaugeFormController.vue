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
      <ToggleSwitch
        :id="'gaugeToggle'"
        :checked="isUseTelemetryLimits"
        label="Use telemetry limits for minimum and maximum ranges"
        @change="toggleUseTelemetryLimits"
      />

      <div v-if="!isUseTelemetryLimits" class="c-form--sub-grid">
        <div class="c-form__row">
          <span class="req-indicator req"> </span>
          <label>Minimum value</label>
          <input
            ref="min"
            v-model.number="min"
            data-field-name="min"
            type="number"
            @input="onChange"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator"> </span>
          <label>Low limit</label>
          <input
            ref="limitLow"
            v-model.number="limitLow"
            data-field-name="limitLow"
            type="number"
            @input="onChange"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator"> </span>
          <label>High limit</label>
          <input
            ref="limitHigh"
            v-model.number="limitHigh"
            data-field-name="limitHigh"
            type="number"
            @input="onChange"
          />
        </div>

        <div class="c-form__row">
          <span class="req-indicator req"> </span>
          <label>Maximum value</label>
          <input
            ref="max"
            v-model.number="max"
            data-field-name="max"
            type="number"
            @input="onChange"
          />
        </div>
      </div>
    </span>
  </span>
</template>

<script>
import ToggleSwitch from '@/ui/components/ToggleSwitch.vue';

export default {
  components: {
    ToggleSwitch
  },
  inject: ['openmct'],
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    this.changes = {};

    return {
      isUseTelemetryLimits: this.model.value.isUseTelemetryLimits,
      limitHigh: this.model.value.limitHigh,
      limitLow: this.model.value.limitLow,
      max: this.model.value.max,
      min: this.model.value.min
    };
  },
  methods: {
    onChange(event) {
      let data = {
        model: {}
      };

      if (event) {
        const target = event.target;
        const property = target.dataset.fieldName;
        data.model.property = Array.from(this.model.property).concat([property]);
        data.value = this[property];
        const targetIndicator = target.parentElement.querySelector('.req-indicator');
        if (targetIndicator.classList.contains('req')) {
          targetIndicator.classList.add('visited');
        }

        this.model.validate(data, (valid) => {
          Object.entries(valid).forEach(([key, isValid]) => {
            const element = this.$refs[key];
            const reqIndicatorElement = element.parentElement.querySelector('.req-indicator');
            reqIndicatorElement.classList.toggle('invalid', !isValid);

            if (
              reqIndicatorElement.classList.contains('req') &&
              (!isValid || reqIndicatorElement.classList.contains('visited'))
            ) {
              reqIndicatorElement.classList.toggle('valid', isValid);
            }
          });
        });
      }

      this.$emit('onChange', data);
    },
    toggleUseTelemetryLimits() {
      this.isUseTelemetryLimits = !this.isUseTelemetryLimits;
      const data = {
        model: {
          property: Array.from(this.model.property).concat(['isUseTelemetryLimits'])
        },
        value: this.isUseTelemetryLimits
      };
      this.$emit('onChange', data);
    }
  }
};
</script>
