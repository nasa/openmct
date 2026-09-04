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
      <div class="grid-cell label" :title="`Minimum ${axisLabel} value.`">Minimum Value</div>
      <div v-if="readOnly" class="grid-cell value" :aria-label="`${axisLabel} Minimum value`">
        {{ rangeMin === '' ? 'Not set' : rangeMin }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMinInputId" class="visually-hidden">{{ axisLabel }} Minimum value</label>
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
        {{ rangeMax === '' ? 'Not set' : rangeMax }}
      </div>
      <div v-else class="grid-cell value">
        <label :for="rangeMaxInputId" class="visually-hidden">{{ axisLabel }} Maximum value</label>
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

const LOG_MODE_NOTICE =
  'A logarithmic axis can only show positive values in graphs and charts. Zero or negative values will be omitted from the plot.';

const AUTOSCALE_RESTORED_NOTICE =
  'The fixed range was entirely below zero, which a logarithmic axis cannot draw, so auto scale has been turned back on.';

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
  },
  methods: {
    initFormValues() {
      const axis = getAxisConfig(this.domainObject, this.axisKey);
      this.autoscale = axis.autoscale !== false;
      this.logMode = axis.logMode === true;

      // A bound may be persisted as null by `updateLogMode` when the new mode
      // cannot draw it. Read each independently, and reset both when there is
      // no persisted range at all, so the form never shows a stale bound that
      // a later save could write back.
      this.rangeMin = axis.range?.min ?? '';
      this.rangeMax = axis.range?.max ?? '';
    },
    /**
     * Fixed scaling needs both bounds. One bound alone leaves Plotly to pick
     * the other, which reads as auto scaling while claiming to be fixed.
     */
    validateRange(range) {
      if (!this.isEntered(range?.min) || !this.isEntered(range?.max)) {
        return 'Specify both a Minimum and a Maximum.';
      }

      const min = Number(range.min);
      const max = Number(range.max);

      if (!Number.isFinite(min)) {
        return 'Minimum must be a number.';
      }

      if (!Number.isFinite(max)) {
        return 'Maximum must be a number.';
      }

      // Equal bounds are rejected along with inverted ones: Plotly cannot draw
      // a zero-width axis and quietly widens it, so the saved range and the
      // drawn one would differ.
      if (min >= max) {
        return 'Minimum must be less than Maximum.';
      }

      // Zero is allowed as a log minimum: the axis is anchored and labelled at
      // 0 even though no value of zero can be drawn there. Negatives have no
      // such reading, and a maximum of zero would leave nothing to draw at all.
      if (this.logMode && min < 0) {
        return 'Minimum cannot be negative in log mode.';
      }

      if (this.logMode && max <= 0) {
        return 'Maximum must be greater than 0 in log mode.';
      }
    },
    /**
     * Whether the user actually put a value in the field. Zero counts - it is a
     * real bound - so this tests for the absence of input rather than treating
     * zero as empty. Whitespace is absence: `Number(' ')` is 0, which would
     * otherwise read as a deliberate bound of zero.
     */
    isEntered(value) {
      if (value === null || typeof value === 'undefined') {
        return false;
      }

      return String(value).trim() !== '';
    },
    updateLogMode() {
      const changes = { logMode: this.logMode };
      let autoscaleRestored = false;

      // A range that was valid on a linear axis is not always drawable on a log
      // one. A negative minimum does have a natural equivalent - zero, which
      // this axis anchors and labels - so clamp it rather than discarding what
      // the user set, and the range stays complete.
      //
      // A maximum of zero or less has no such equivalent. Since a valid range
      // has its minimum below its maximum, that puts the whole range where a
      // log axis cannot draw, leaving nothing to clamp to. Fall back to auto
      // scaling rather than keeping fixed scaling that cannot be honoured.
      if (this.logMode && this.autoscale === false) {
        const hasMin = this.isEntered(this.rangeMin);
        const hasDrawableMax = this.isEntered(this.rangeMax) && Number(this.rangeMax) > 0;

        if (hasMin && hasDrawableMax) {
          this.rangeMin = Math.max(Number(this.rangeMin), 0);
          changes.range = { min: Number(this.rangeMin), max: Number(this.rangeMax) };
        } else {
          this.autoscale = true;
          changes.autoscale = true;
          autoscaleRestored = true;
        }
      }

      this.revalidate();
      this.persistAxis(changes);

      // State the limitation once, to the person configuring the chart. It is a
      // property of a log axis rather than of whatever data happens to be on
      // screen, so it is said here rather than detected while plotting - and
      // whoever builds the plot is the one who can act on it. Left for the user
      // to dismiss, so it cannot be missed.
      if (this.logMode) {
        this.openmct.notifications.alert(
          autoscaleRestored ? `${LOG_MODE_NOTICE} ${AUTOSCALE_RESTORED_NOTICE}` : LOG_MODE_NOTICE
        );
      }
    },
    updateAutoscale() {
      // Validate before persisting, so switching to fixed scaling without a
      // usable range reports the problem in the same beat rather than after it.
      this.revalidate();
      this.persistAxis({ autoscale: this.autoscale });
    },
    updateRange() {
      this.revalidate();
      if (this.validationErrors.range) {
        // An invalid pair is never persisted - handing Plotly an inverted or
        // zero-width range would draw something the form does not describe.
        return;
      }

      this.persistAxis({ range: { min: Number(this.rangeMin), max: Number(this.rangeMax) } });
    },
    revalidate() {
      this.validationErrors.range = this.autoscale
        ? undefined
        : this.validateRange({ min: this.rangeMin, max: this.rangeMax });
    },
    /**
     * Persist the axis as a whole, so log mode, auto scaling and the range they
     * constrain are never written apart from one another.
     */
    persistAxis(changes) {
      this.openmct.objects.mutate(
        this.domainObject,
        `configuration.${AXIS_SCALING_KEY}.${this.axisKey}`,
        { ...getAxisConfig(this.domainObject, this.axisKey), ...changes }
      );
    }
  }
};
</script>
