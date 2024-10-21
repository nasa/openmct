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
    <div class="c-tc-input-popup__input-grid">
      <div class="pr-time-label pr-time-label-start-time">Start</div>
      <div class="pr-time-label pr-time-label-end-time">End</div>

      <div class="pr-time-input pr-time-input-start">
        <input
          ref="start"
          v-model="formattedBounds.start"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start time"
          @input="validateInput('start')"
          @change="reportValidity('start')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div class="pr-time-input pr-time-input-end">
        <input
          ref="end"
          v-model="formattedBounds.end"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End time"
          @input="validateInput('end')"
          @change="reportValidity('end')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="hasInputValidityError"
          aria-label="Submit time bounds"
          @click.prevent="handleFormSubmission(true)"
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
export default {
  inject: [
    'openmct',
    'isTimeSystemUTCBased',
    'timeContext',
    'timeSystemKey',
    'timeSystemFormatter',
    'timeSystemDurationFormatter',
    'bounds'
  ],
  emits: ['dismiss'],
  data() {
    return {
      formattedBounds: {},
      inputValidityMap: {
        start: { valid: true },
        end: { valid: true }
      },
      logicalValidityMap: {
        limit: { valid: true },
        bounds: { valid: true }
      }
    };
  },
  computed: {
    hasInputValidityError() {
      return Object.values(this.inputValidityMap).some((isValid) => !isValid.valid);
    },
    hasLogicalValidationErrors() {
      return Object.values(this.logicalValidityMap).some((isValid) => !isValid.valid);
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
      const start = this.timeSystemFormatter.format(this.bounds.start);
      const end = this.timeSystemFormatter.format(this.bounds.end);

      this.formattedBounds = {
        start,
        end
      };
    },
    setBoundsFromView(dismiss) {
      if (this.$refs.fixedDeltaInput.checkValidity()) {
        const start = this.timeSystemFormatter.parse(this.formattedBounds.start);
        const end = this.timeSystemFormatter.parse(this.formattedBounds.end);

        this.timeContext.setBounds({
          start,
          end
        });
      }

      if (dismiss) {
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
    handleFormSubmission(shouldDismiss) {
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

      const validationResult = this.timeFormatter.validate(this.formattedBounds[refName])
        ? { valid: true }
        : { valid: false, message: `Invalid Time` };

      this.inputValidityMap[refName] = validationResult;
    },
    validateBounds() {
      const bounds = {
        start: this.timeSystemFormatter.parse(this.formattedBounds.start),
        end: this.timeSystemFormatter.parse(this.formattedBounds.end)
      };

      this.logicalValidityMap.bounds = this.timeContext.validateBounds(bounds);
    },
    validateLimit(bounds) {
      const limit = this.configuration?.menuOptions
        ?.filter((option) => option.timeSystem === this.timeSystemKey)
        ?.find((option) => option.limit)?.limit;

      if (this.isTimeSystemUTCBased && limit && bounds.end - bounds.start > limit) {
        this.logicalValidityMap.limit = {
          valid: false,
          message: `Start and end difference exceeds allowable limit of ${limit}`
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

      return this.$refs.start;
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    }
  }
};
</script>
