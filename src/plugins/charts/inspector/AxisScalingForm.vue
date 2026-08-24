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
    <li v-if="showLogMode" class="grid-row">
      <div
        class="grid-cell label"
        :title="`Draw the ${axisLabel} on a logarithmic scale. Values of zero or less cannot be shown on a log axis and will be omitted.`"
      >
        Log mode
      </div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Log mode`">
        {{ logMode ? 'Enabled' : 'Disabled' }}
      </div>
      <div v-else class="grid-cell value">
        <input
          :id="logModeInputId"
          v-model="logMode"
          class="js-log-mode-input"
          type="checkbox"
          @change="updateLogMode"
        />
        <label :for="logModeInputId" class="visually-hidden">{{ axisLabel }} Log mode</label>
      </div>
    </li>
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
        <input
          :id="autoscaleInputId"
          v-model="autoscale"
          type="checkbox"
          @change="updateAutoscale"
        />
        <label :for="autoscaleInputId" class="visually-hidden">{{ axisLabel }} Auto scale</label>
      </div>
    </li>
    <div v-if="!autoscale && !readOnly && validationErrors.range" class="grid-span-all form-error">
      {{ validationErrors.range }}
    </div>
    <li v-show="!autoscale" class="grid-row">
      <div
        class="grid-cell label"
        :title="`Minimum ${axisLabel} value. Leave blank to scale this end to the data.`"
      >
        Minimum Value
      </div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Minimum value`">
        {{ rangeMin === '' ? 'Auto' : rangeMin }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMinInputId" class="visually-hidden">{{ axisLabel }} Minimum value</label>
        <input
          :id="rangeMinInputId"
          v-model="rangeMin"
          class="c-input--flex"
          type="number"
          placeholder="Auto"
          @change="updateRange"
        />
      </div>
    </li>
    <li v-show="!autoscale" class="grid-row">
      <div
        class="grid-cell label"
        :title="`Maximum ${axisLabel} value. Leave blank to scale this end to the data.`"
      >
        Maximum Value
      </div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Maximum value`">
        {{ rangeMax === '' ? 'Auto' : rangeMax }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMaxInputId" class="visually-hidden">{{ axisLabel }} Maximum value</label>
        <input
          :id="rangeMaxInputId"
          v-model="rangeMax"
          class="c-input--flex"
          type="number"
          placeholder="Auto"
          @change="updateRange"
        />
      </div>
    </li>
  </ul>
</template>

<script>
import { AXIS_SCALING_KEY, getAxisConfig } from '../axisConfig.js';

const LOG_MODE_NOTICE =
  'A logarithmic axis cannot show values of zero or less. Any such values will be omitted from the plot.';

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
      logMode: false,
      rangeMin: '',
      rangeMax: '',
      validationErrors: {}
    };
  },
  computed: {
    /**
     * Log scaling is offered on the Y axis only - see `isLogModeEnabled`.
     */
    showLogMode() {
      return this.axisKey === 'yAxis';
    },
    logModeInputId() {
      return `${this.axisKey}-log-mode-input`;
    },
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
      this.logMode = axis.logMode === true;

      // Each bound is read independently - one may be set while the other is
      // deliberately blank. A persisted null means "autorange this end".
      if (axis.range) {
        this.rangeMin = axis.range.min ?? '';
        this.rangeMax = axis.range.max ?? '';
      }
    },
    /**
     * A blank bound means "scale this end to the data", so either may be
     * omitted - but not both, which would just be auto scaling.
     */
    validateRange(range) {
      if (!range) {
        return 'Need range';
      }

      const hasMin = this.isEntered(range.min);
      const hasMax = this.isEntered(range.max);

      if (!hasMin && !hasMax) {
        return 'Specify a Minimum, a Maximum, or both.';
      }

      if (hasMin && Number.isNaN(Number(range.min))) {
        return 'Minimum must be a number.';
      }

      if (hasMax && Number.isNaN(Number(range.max))) {
        return 'Maximum must be a number.';
      }

      if (hasMin && hasMax && Number(range.min) > Number(range.max)) {
        return 'Minimum must be less than Maximum.';
      }

      // Zero is allowed as a log minimum: the axis is anchored and labelled at
      // 0 even though no value of zero can be drawn there. Negatives have no
      // such reading, and a maximum of zero would leave nothing to draw at all.
      if (this.logMode && hasMin && Number(range.min) < 0) {
        return 'Minimum cannot be negative in log mode.';
      }

      if (this.logMode && hasMax && Number(range.max) <= 0) {
        return 'Maximum must be greater than 0 in log mode.';
      }
    },
    /**
     * Whether the user actually put a value in the field. Zero counts - it is a
     * real bound - so this tests for the absence of input, not falsiness.
     */
    isEntered(value) {
      return value !== '' && value !== null && typeof value !== 'undefined';
    },
    updateLogMode() {
      this.persist('logMode', this.logMode);

      // State the limitation once, to the person configuring the chart. It is a
      // property of a log axis rather than of whatever data happens to be on
      // screen, so it is said here rather than detected while plotting - and
      // whoever builds the plot is the one who can act on it. Left for the user
      // to dismiss, so it cannot be missed.
      if (this.logMode) {
        this.openmct.notifications.alert(LOG_MODE_NOTICE);
      }

      // Turning log mode on can invalidate a fixed range that was previously
      // acceptable, and turning it off can make one valid again.
      if (this.autoscale === false) {
        this.validationErrors.range = this.validateRange({
          min: this.rangeMin,
          max: this.rangeMax
        });
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

      // An omitted bound persists as null so it survives JSON round-tripping
      // and reads unambiguously as "autorange this end".
      this.persist('range', {
        min: this.isEntered(range.min) ? Number(range.min) : null,
        max: this.isEntered(range.max) ? Number(range.max) : null
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
