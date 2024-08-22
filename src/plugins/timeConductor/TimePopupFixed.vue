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
          ref="startTime"
          v-model="formattedBounds.start"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start time"
          @input="validateAllBounds('startTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div class="pr-time-input pr-time-input-end">
        <input
          ref="endTime"
          v-model="formattedBounds.end"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End time"
          @input="validateAllBounds('endTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="isDisabled"
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
    'timeSystemFormatter',
    'timeSystemDurationFormatter',
    'bounds'
  ],
  emits: ['update', 'dismiss'],
  data() {
    return {
      formattedBounds: {},
      isDisabled: false
    };
  },
  computed: {

  },
  watch: {
    bounds: {
      handler() {
        console.log(this.bounds);
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
    clearAllValidation() {
      [this.$refs.startTime, this.$refs.endTime].forEach(this.clearValidationForInput);
    },
    clearValidationForInput(input) {
      if (input) {
        input.setCustomValidity('');
        input.title = '';
      }
    },
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
    handleFormSubmission(shouldDismiss) {
      this.validateAllBounds('startDate');
      this.validateAllBounds('endDate');

      if (!this.isDisabled) {
        this.setBoundsFromView(shouldDismiss);
      }
    },
    validateAllBounds(ref) {
      this.isDisabled = false;

      if (!this.areBoundsFormatsValid()) {
        this.isDisabled = true;
        return false;
      }

      let validationResult = { valid: true };
      const currentInput = this.$refs[ref];

      return [this.$refs.startTime, this.$refs.endTime].every((input) => {
        const start = this.timeSystemFormatter.parse(this.formattedBounds.start);
        const end = this.timeSystemFormatter.parse(this.formattedBounds.end);

        const bounds = {
          start,
          end
        };

        //TODO: Do we need limits here? We have conductor limits disabled right now
        // const limit = this.getBoundsLimit();
        const limit = false;

        if (this.isTimeSystemUTCBased && limit && bounds.end - bounds.start > limit) {
          if (input === currentInput) {
            validationResult = {
              valid: false,
              message: 'Start and end difference exceeds allowable limit'
            };
          }
        } else {
          if (input === currentInput) {
            validationResult = this.timeContext.validateBounds(bounds);
          }
        }

        return this.handleValidationResults(input, validationResult);
      });
    },
    areBoundsFormatsValid() {
      let validationResult = {
        valid: true
      };

      return [this.$refs.startTime, this.$refs.endTime].every((input) => {
        const formattedBounds =
          input === this.$refs.startTime
            ? this.formattedBounds.start
            : this.formattedBounds.end;
        if (!this.timeSystemFormatter.validate(formattedBounds)) {
          validationResult = {
            valid: false,
            message: 'Invalid date'
          };
        }

        return this.handleValidationResults(input, validationResult);
      });
    },
    getBoundsLimit() {
      const configuration = this.configuration.menuOptions
        .filter((option) => option.timeSystem === this.timeSystem.key)
        .find((option) => option.limit);

      const limit = configuration ? configuration.limit : undefined;

      return limit;
    },
    handleValidationResults(input, validationResult) {
      if (validationResult.valid !== true) {
        input.setCustomValidity(validationResult.message);
        input.title = validationResult.message;
        this.isDisabled = true;
      } else {
        input.setCustomValidity('');
        input.title = '';
      }

      this.$refs.fixedDeltaInput.reportValidity();

      return validationResult.valid;
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    }
  }
};
</script>
