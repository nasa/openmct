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
  <form ref="fixedDeltaInput">
    <div class="c-tc-input-popup__input-grid-utc">
      <div class="pr-time-label pr-time-label-start-date"><em>Start</em> Date</div>
      <div class="pr-time-label pr-time-label-start-time">Time</div>
      <div class="pr-time-label pr-time-label-end-date"><em>End</em> Date</div>
      <div class="pr-time-label pr-time-label-end-time">Time</div>

      <div
        class="pr-time-input pr-time-input--date pr-time-input--input-and-button pr-time-input-start-date"
      >
        <DatePicker
          class="c-ctrl-wrapper--menus-right"
          :default-date-time="formattedBounds.startDate"
          @date-selected="startDateSelected"
        />
        <input
          ref="startDate"
          v-model="formattedBounds.startDate"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start date"
          @input="validateInput('startDate')"
          @change="reportValidity('startDate')"
        />
      </div>

      <div class="pr-time-input pr-time-input--time pr-time-input-start-time">
        <input
          ref="startTime"
          v-model="formattedBounds.startTime"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start time"
          @input="validateInput('startTime')"
          @change="reportValidity('startTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div
        class="pr-time-input pr-time-input--date pr-time-input--input-and-button pr-time-input-end-date"
      >
        <DatePicker
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.endDate"
          @date-selected="endDateSelected"
        />
        <input
          ref="endDate"
          v-model="formattedBounds.endDate"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End date"
          @input="validateInput('endDate')"
          @change="reportValidity('endDate')"
        />
      </div>

      <div class="pr-time-input pr-time-input--time pr-time-input-end-time">
        <input
          ref="endTime"
          v-model="formattedBounds.endTime"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End time"
          @input="validateInput('endTime')"
          @change="reportValidity('endTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="hasInputValidityError"
          aria-label="Submit time bounds"
          @click.prevent="submitForm(true)"
        ></button>
        <button
          class="c-button icon-x"
          aria-label="Discard changes and close time popup"
          @click.prevent="hide"
        ></button>
      </div>
    </div>
  </form>
</template>

<script>
import DatePicker from './DatePicker.vue';

export default {
  components: {
    DatePicker
  },
  inject: [
    'openmct',
    'isTimeSystemUTCBased',
    'timeContext',
    'timeSystemFormatter',
    'timeSystemDurationFormatter',
    'bounds'
  ],
  props: {
    delimiter: {
      type: String,
      required: true
    }
  },
  emits: ['update', 'dismiss'],
  data() {
    return {
      formattedBounds: {},
      inputValidityMap: {
        startDate: { valid: true },
        startTime: { valid: true },
        endDate: { valid: true },
        endTime: { valid: true }
      },
      logicalValidityMap: {
        limit: { valid: true },
        bounds: { valid: true }
      }
    };
  },
  computed: {
    hasInputValidityError() {
      return Object.values(this.inputValidityMap).some((inputValidity) => !inputValidity.valid);
    },
    hasLogicalValidationErrors() {
      return Object.values(this.logicalValidityMap).some(
        (logicalValidity) => !logicalValidity.valid
      );
    },
    isValid() {
      return !this.hasInputValidityError && !this.hasLogicalValidationErrors;
    }
  },
  watch: {
    bounds: {
      handler() {
        this.setViewFromBounds();
      }
    }
  },
  mounted() {
    this.setViewFromBounds();
  },
  beforeUnmount() {
    this.clearAllValidation();
  },
  methods: {
    setViewFromBounds() {
      this.formattedBounds = {
        startDate: this.timeSystemFormatter.format(this.bounds.start).split(this.delimiter)[0],
        startTime: this.timeSystemDurationFormatter.format(Math.abs(this.bounds.start)),
        endDate: this.timeSystemFormatter.format(this.bounds.end).split(this.delimiter)[0],
        endTime: this.timeSystemDurationFormatter.format(Math.abs(this.bounds.end))
      };
    },
    setBoundsFromView(shouldDismiss) {
      if (this.$refs.fixedDeltaInput.checkValidity()) {
        const start = this.timeSystemFormatter.parse(
          `${this.formattedBounds.startDate}${this.delimiter}${this.formattedBounds.startTime}`
        );
        const end = this.timeSystemFormatter.parse(
          `${this.formattedBounds.endDate}${this.delimiter}${this.formattedBounds.endTime}`
        );

        this.timeContext.setBounds({
          start,
          end
        });
      }

      if (shouldDismiss) {
        this.$emit('dismiss');

        return false;
      }
    },
    clearAllValidation() {
      Object.keys(this.inputValidityMap).forEach(this.clearValidation);
    },
    clearValidation(refName) {
      const input = this.getInput(refName);

      input.setCustomValidity('');
      input.title = '';
    },
    submitForm(shouldDismiss) {
      this.validateLimit();
      this.reportValidity('limit');
      this.validateBounds();
      this.reportValidity('bounds');

      if (this.isValid) {
        this.setBoundsFromView(shouldDismiss);
      }
    },
    validateInput(refName) {
      this.clearAllValidation();
      const inputType = refName.includes('Date') ? 'Date' : 'Time';
      const formatter =
        inputType === 'Date' ? this.timeSystemFormatter : this.timeSystemDurationFormatter;
      const validationResult = formatter.validate(this.formattedBounds[refName])
        ? { valid: true }
        : { valid: false, message: `Invalid ${inputType}` };

      this.inputValidityMap[refName] = validationResult;
    },
    validateBounds() {
      const bounds = {
        start: this.timeSystemFormatter.parse(
          `${this.formattedBounds.startDate}${this.delimiter}${this.formattedBounds.startTime}`
        ),
        end: this.timeSystemFormatter.parse(
          `${this.formattedBounds.endDate}${this.delimiter}${this.formattedBounds.endTime}`
        )
      };

      this.logicalValidityMap.bounds = this.openmct.time.validateBounds(bounds);
    },
    validateLimit(bounds) {
      const limit = this.configuration?.menuOptions
        ?.filter((option) => option.timeSystem === this.timeSystemKey)
        ?.find((option) => option.limit)?.limit;

      if (this.isUTCBased && limit && bounds.end - bounds.start > limit) {
        this.logicalValidityMap.limit = {
          valid: false,
          message: 'Start and end difference exceeds allowable limit'
        };
      } else {
        this.logicalValidityMap.limit = { valid: true };
      }
    },
    reportValidity(refName) {
      const input = this.getInput(refName);
      const validationResult = this.inputValidityMap[refName] ?? this.logicalValidityMap[refName];

      if (validationResult.valid !== true) {
        input.setCustomValidity(validationResult.message);
        input.title = validationResult.message;
        this.hasLogicalValidationErrors = true;
      } else {
        input.setCustomValidity('');
        input.title = '';
      }

      this.$refs.fixedDeltaInput.reportValidity();
    },
    getInput(refName) {
      if (Object.keys(this.inputValidityMap).includes(refName)) {
        return this.$refs[refName];
      }

      return this.$refs.startDate;
    },
    startDateSelected(date) {
      this.formattedBounds.startDate = this.timeSystemFormatter
        .format(date)
        .split(this.delimiter)[0];
      this.validateInput('startDate');
      this.reportValidity('startDate');
    },
    endDateSelected(date) {
      this.formattedBounds.endDate = this.timeSystemFormatter.format(date).split(this.delimiter)[0];
      this.validateInput('endDate');
      this.reportValidity('endDate');
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    }
  }
};
</script>
