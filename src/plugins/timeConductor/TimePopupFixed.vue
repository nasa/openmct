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
      <div class="pr-time-label"><em>Start</em> Date</div>
      <div class="pr-time-label">Time</div>
      <div class="pr-time-label"></div>
      <div class="pr-time-label"><em>End</em> Date</div>
      <div class="pr-time-label">Time</div>
      <div class="pr-time-label"></div>

      <div class="pr-time-input pr-time-input--date pr-time-input--input-and-button">
        <input
          ref="startDate"
          v-model="formattedBounds.start"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start date"
          @change="validateAllBounds('startDate')"
        />
        <DatePicker
          v-if="isTimeSystemUTCBased"
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.start"
          @date-selected="startDateSelected"
        />
      </div>

      <div class="pr-time-input pr-time-input--time">
        <input
          ref="startTime"
          v-model="formattedBounds.startTime"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start time"
          @change="validateAllBounds('startDate')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div class="pr-time-input pr-time-input--date pr-time-input--input-and-button">
        <input
          ref="endDate"
          v-model="formattedBounds.end"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End date"
          @change="validateAllBounds('endDate')"
        />
        <DatePicker
          v-if="isTimeSystemUTCBased"
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.end"
          @date-selected="endDateSelected"
        />
      </div>

      <div class="pr-time-input pr-time-input--time">
        <input
          ref="endTime"
          v-model="formattedBounds.endTime"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End time"
          @change="validateAllBounds('endDate')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="isDisabled"
          aria-label="Submit time bounds"
          @click.prevent="submit"
        ></button>
        <button
          class="c-button icon-x"
          aria-label="Discard time bounds"
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
  inject: ['openmct', 'isTimeSystemUTCBased', 'timeSystemFormatter', 'timeSystemDurationFormatter', 'bounds'],
  emits: ['update', 'dismiss'],
  data() {
    return {
      formattedBounds: {},
      isDisabled: false
    };
  },
  watch: {
    bounds: {
      handler() {
        this.handleNewBounds();
      },
      deep: true
    }
  },
  created() {
    this.setViewFromBounds();
  },
  beforeUnmount() {
    this.clearAllValidation();
  },
  methods: {
    handleNewBounds() {
      this.setViewFromBounds();
    },
    clearAllValidation() {
      [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
    },
    clearValidationForInput(input) {
      input.setCustomValidity('');
      input.title = '';
    },
    setViewFromBounds() {
      const formattedBounds = {};

      formattedBounds.start = this.timeSystemFormatter.format(this.bounds.start).split(' ')[0];
      formattedBounds.end = this.timeSystemFormatter.format(this.bounds.end).split(' ')[0];
      formattedBounds.startTime = this.timeSystemDurationFormatter.format(Math.abs(this.bounds.start));
      formattedBounds.endTime = this.timeSystemDurationFormatter.format(Math.abs(this.bounds.end));

      this.formattedBounds = formattedBounds;
    },
    setBoundsFromView(dismiss) {
      if (this.$refs.fixedDeltaInput.checkValidity()) {
        let start = this.timeSystemFormatter.parse(
          `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
        );
        let end = this.timeSystemFormatter.parse(
          `${this.formattedBounds.end} ${this.formattedBounds.endTime}`
        );

        this.openmct.time.setBounds({
          start: start,
          end: end
        });
      }

      if (dismiss) {
        this.$emit('dismiss');

        return false;
      }
    },
    submit() {
      this.validateAllBounds('startDate');
      this.validateAllBounds('endDate');
      this.submitForm(!this.isDisabled);
    },
    submitForm(dismiss) {
      // Allow Vue model to catch up to user input.
      // Submitting form will cause validation messages to display (but only if triggered by button click)
      this.$nextTick(() => this.setBoundsFromView(dismiss));
    },
    validateAllBounds(ref) {
      if (!this.areBoundsFormatsValid()) {
        return false;
      }

      let validationResult = {
        valid: true
      };
      const currentInput = this.$refs[ref];

      return [this.$refs.startDate, this.$refs.endDate].every((input) => {
        let boundsValues = {
          start: this.timeSystemFormatter.parse(
            `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
          ),
          end: this.timeSystemFormatter.parse(
            `${this.formattedBounds.end} ${this.formattedBounds.endTime}`
          )
        };
        //TODO: Do we need limits here? We have conductor limits disabled right now
        // const limit = this.getBoundsLimit();
        const limit = false;

        if (this.isTimeSystemUTCBased && limit && boundsValues.end - boundsValues.start > limit) {
          if (input === currentInput) {
            validationResult = {
              valid: false,
              message: 'Start and end difference exceeds allowable limit'
            };
          }
        } else {
          if (input === currentInput) {
            validationResult = this.openmct.time.validateBounds(boundsValues);
          }
        }

        return this.handleValidationResults(input, validationResult);
      });
    },
    areBoundsFormatsValid() {
      let validationResult = {
        valid: true
      };

      return [this.$refs.startDate, this.$refs.endDate].every((input) => {
        const formattedDate =
          input === this.$refs.startDate
            ? `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
            : `${this.formattedBounds.end} ${this.formattedBounds.endTime}`;
        if (!this.timeSystemFormatter.validate(formattedDate)) {
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
        this.isDisabled = false;
      }

      this.$refs.fixedDeltaInput.reportValidity();

      return validationResult.valid;
    },
    startDateSelected(date) {
      this.formattedBounds.start = this.timeSystemFormatter.format(date).split(' ')[0];
      this.validateAllBounds('startDate');
    },
    endDateSelected(date) {
      this.formattedBounds.end = this.timeSystemFormatter.format(date).split(' ')[0];
      this.validateAllBounds('endDate');
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    }
  }
};
</script>
