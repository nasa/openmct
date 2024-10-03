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
          @change="validateAllBounds('startDate')"
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
          @change="validateAllBounds('startDate')"
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
          @change="validateAllBounds('endDate')"
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
  props: {
    delimiter: {
      type: String,
      required: true
    }
  },
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
      [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
    },
    clearValidationForInput(input) {
      input.setCustomValidity('');
      input.title = '';
    },
    setViewFromBounds() {
      const formattedStartBounds = this.timeSystemFormatter.format(this.bounds.start);
      const formattedEndBounds = this.timeSystemFormatter.format(this.bounds.end);

      this.formattedBounds = {
        startDate: formattedStartBounds.split(this.delimiter)[0],
        startTime: formattedStartBounds.split(this.delimiter)[1],
        endDate: formattedEndBounds.split(this.delimiter)[0],
        endTime: formattedEndBounds.split(this.delimiter)[1]
      };
    },
    setBoundsFromView(dismiss) {
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
        const boundsValues = {
          start: this.timeSystemFormatter.parse(
            `${this.formattedBounds.startDate}${this.delimiter}${this.formattedBounds.startTime}`
          ),
          end: this.timeSystemFormatter.parse(
            `${this.formattedBounds.endDate}${this.delimiter}${this.formattedBounds.endTime}`
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
            validationResult = this.timeContext.validateBounds(boundsValues);
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
            ? `${this.formattedBounds.startDate}${this.delimiter}${this.formattedBounds.startTime}`
            : `${this.formattedBounds.endDate}${this.delimiter}${this.formattedBounds.endTime}`;
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
      this.formattedBounds.startDate = this.timeSystemFormatter.format(date).split(this.delimiter)[0];
      this.validateAllBounds('startDate');
    },
    endDateSelected(date) {
      this.formattedBounds.endDate = this.timeSystemFormatter.format(date).split(this.delimiter)[0];
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
