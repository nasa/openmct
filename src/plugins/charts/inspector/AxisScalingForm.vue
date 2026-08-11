<!--
 Open MCT, Copyright (c) 2014-2026, United States Government
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
  <ul class="l-inspector-part" :aria-label="`${axisLabel} Scaling`">
    <h2>{{ axisLabel }} Scaling</h2>
    <li class="grid-row">
      <div
        class="grid-cell label"
        :title="`Automatically scale the ${axisLabel} to keep all values in view.`"
      >
        Auto scale
      </div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Auto scale`">
        {{ autoscale ? 'Enabled' : 'Disabled' }}
      </div>
      <div v-else class="grid-cell value">
        <input :id="autoscaleInputId" v-model="autoscale" type="checkbox" @change="updateAutoscale" />
        <label :for="autoscaleInputId" class="visually-hidden">{{ axisLabel }} Auto scale</label>
      </div>
    </li>
    <div v-if="!autoscale && !readOnly && validationErrors.range" class="grid-span-all form-error">
      {{ validationErrors.range }}
    </div>
    <li v-show="!autoscale" class="grid-row">
      <div class="grid-cell label" :title="`Minimum ${axisLabel} value.`">Minimum Value</div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Minimum value`">
        {{ rangeMin }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMinInputId" class="visually-hidden"
          >{{ axisLabel }} Minimum value</label
        >
        <input
          :id="rangeMinInputId"
          v-model="rangeMin"
          class="c-input--flex"
          type="number"
          @change="updateRange"
        />
      </div>
    </li>
    <li v-show="!autoscale" class="grid-row">
      <div class="grid-cell label" :title="`Maximum ${axisLabel} value.`">Maximum Value</div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Maximum value`">
        {{ rangeMax }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMaxInputId" class="visually-hidden"
          >{{ axisLabel }} Maximum value</label
        >
        <input
          :id="rangeMaxInputId"
          v-model="rangeMax"
          class="c-input--flex"
          type="number"
          @change="updateRange"
        />
      </div>
    </li>
  </ul>
</template>

<script>
import { AXIS_SCALING_KEY, getAxisConfig } from '../axisConfig.js';

/**
 * Manual (fixed) axis scaling for the Bar Graph and Scatter Plot views.
 *
 * Note: the range validation below intentionally duplicates the semantics of the
 * `range` field in src/plugins/plot/inspector/forms/YAxisForm.vue. That component is
 * coupled to the plot configuration model (configStore / YAxisModel), which these
 * Plotly-based views do not have, and extracting the shared logic would mean editing
 * the plot plugin. Keep the two in sync if the validation rules change.
 */
export default {
  inject: ['openmct', 'domainObject'],
  props: {
    axisKey: {
      type: String,
      required: true,
      validator: (value) => ['xAxis', 'yAxis'].includes(value)
    },
    axisLabel: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      autoscale: true,
      rangeMin: '',
      rangeMax: '',
      validationErrors: {}
    };
  },
  computed: {
    autoscaleInputId() {
      return `${this.axisKey}-autoscale-input`;
    },
    rangeMinInputId() {
      return `${this.axisKey}-range-min`;
    },
    rangeMaxInputId() {
      return `${this.axisKey}-range-max`;
    }
  },
  mounted() {
    this.initFormValues();
    this.unobserve = this.openmct.objects.observe(
      this.domainObject,
      `configuration.${AXIS_SCALING_KEY}.${this.axisKey}`,
      this.initFormValues
    );
  },
  beforeUnmount() {
    if (this.unobserve) {
      this.unobserve();
    }

    // Never leave the chart with auto scale off and an unusable range.
    if (this.autoscale === false && this.validationErrors.range) {
      this.autoscale = true;
      this.persist('autoscale', true);
    }
  },
  methods: {
    initFormValues() {
      const axis = getAxisConfig(this.domainObject, this.axisKey);
      this.autoscale = axis.autoscale !== false;

      if (axis.range?.min !== undefined && axis.range?.max !== undefined) {
        this.rangeMin = axis.range.min;
        this.rangeMax = axis.range.max;
      }
    },
    validateRange(range) {
      if (!range) {
        return 'Need range';
      }

      if (range.min === '' || range.min === null || typeof range.min === 'undefined') {
        return 'Must specify Minimum';
      }

      if (range.max === '' || range.max === null || typeof range.max === 'undefined') {
        return 'Must specify Maximum';
      }

      if (Number.isNaN(Number(range.min))) {
        return 'Minimum must be a number.';
      }

      if (Number.isNaN(Number(range.max))) {
        return 'Maximum must be a number.';
      }

      if (Number(range.min) > Number(range.max)) {
        return 'Minimum must be less than Maximum.';
      }
    },
    updateAutoscale() {
      this.persist('autoscale', this.autoscale);

      // If auto scale is turned off, we must know what the user defined min and max ranges are
      if (this.autoscale === false) {
        this.validationErrors.range = this.validateRange({
          min: this.rangeMin,
          max: this.rangeMax
        });
      } else {
        this.validationErrors.range = undefined;
      }
    },
    updateRange() {
      const range = {
        min: this.rangeMin,
        max: this.rangeMax
      };

      this.validationErrors.range = this.validateRange(range);
      if (this.validationErrors.range) {
        return;
      }

      this.persist('range', {
        min: Number(range.min),
        max: Number(range.max)
      });
    },
    persist(property, value) {
      this.openmct.objects.mutate(
        this.domainObject,
        `configuration.${AXIS_SCALING_KEY}.${this.axisKey}.${property}`,
        value
      );
    }
  }
};
</script>
