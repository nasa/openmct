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
  <form ref="fixedDeltaInput" class="c-conductor__inputs">
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__start-fixed">
      <!-- Fixed start -->
      <div class="c-conductor__start-fixed__label">Start</div>
      <input
        ref="startDate"
        v-model="formattedBounds.start"
        class="c-input--datetime"
        type="text"
        autocorrect="off"
        spellcheck="false"
        @change="
          validateAllBounds('startDate');
          submitForm();
        "
      />
      <date-picker
        v-if="isUTCBased"
        class="c-ctrl-wrapper--menus-left"
        :bottom="keyString !== undefined"
        :default-date-time="formattedBounds.start"
        :formatter="timeFormatter"
        @date-selected="startDateSelected"
      />
    </div>
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
      <!-- Fixed end and RT 'last update' display -->
      <div class="c-conductor__end-fixed__label">End</div>
      <input
        ref="endDate"
        v-model="formattedBounds.end"
        class="c-input--datetime"
        type="text"
        autocorrect="off"
        spellcheck="false"
        @change="
          validateAllBounds('endDate');
          submitForm();
        "
      />
      <date-picker
        v-if="isUTCBased"
        class="c-ctrl-wrapper--menus-left"
        :bottom="keyString !== undefined"
        :default-date-time="formattedBounds.end"
        :formatter="timeFormatter"
        @date-selected="endDateSelected"
      />
    </div>
  </form>
</template>

<script>
import DatePicker from './DatePicker.vue';
import _ from 'lodash';

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
  components: {
    DatePicker
  },
  inject: ['openmct'],
  props: {
    keyString: {
      type: String,
      default() {
        return undefined;
      }
    },
    inputBounds: {
      type: Object,
      default() {
        return undefined;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    let timeSystem = this.openmct.time.timeSystem();
    let durationFormatter = this.getFormatter(
      timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );
    let timeFormatter = this.getFormatter(timeSystem.timeFormat);
    let bounds = this.bounds || this.openmct.time.bounds();

    return {
      showTCInputStart: true,
      showTCInputEnd: true,
      durationFormatter,
      timeFormatter,
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      formattedBounds: {
        start: timeFormatter.format(bounds.start),
        end: timeFormatter.format(bounds.end)
      },
      isUTCBased: timeSystem.isUTCBased
    };
  },
  watch: {
    keyString() {
      this.setTimeContext();
    },
    inputBounds: {
      handler(newBounds) {
        this.handleNewBounds(newBounds);
      },
      deep: true
    }
  },
  mounted() {
    this.handleNewBounds = _.throttle(this.handleNewBounds, 300);
    this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.timeSystem())));
    this.openmct.time.on('timeSystem', this.setTimeSystem);
    this.setTimeContext();
  },
  beforeDestroy() {
    this.clearAllValidation();
    this.openmct.time.off('timeSystem', this.setTimeSystem);
    this.stopFollowingTimeContext();
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.keyString ? this.objectPath : []);

      this.handleNewBounds(this.timeContext.bounds());
      this.timeContext.on('bounds', this.handleNewBounds);
      this.timeContext.on('clock', this.clearAllValidation);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('bounds', this.handleNewBounds);
        this.timeContext.off('clock', this.clearAllValidation);
      }
    },
    handleNewBounds(bounds) {
      this.setBounds(bounds);
      this.setViewFromBounds(bounds);
    },
    clearAllValidation() {
      [this.$refs.startDate, this.$refs.endDate].forEach(this.clearValidationForInput);
    },
    clearValidationForInput(input) {
      input.setCustomValidity('');
      input.title = '';
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setViewFromBounds(bounds) {
      this.formattedBounds.start = this.timeFormatter.format(bounds.start);
      this.formattedBounds.end = this.timeFormatter.format(bounds.end);
    },
    setTimeSystem(timeSystem) {
      this.timeSystem = timeSystem;
      this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
      this.durationFormatter = this.getFormatter(
        timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
      );
      this.isUTCBased = timeSystem.isUTCBased;
    },
    getFormatter(key) {
      return this.openmct.telemetry.getValueFormatter({
        format: key
      }).formatter;
    },
    setBoundsFromView($event) {
      if (this.$refs.fixedDeltaInput.checkValidity()) {
        let start = this.timeFormatter.parse(this.formattedBounds.start);
        let end = this.timeFormatter.parse(this.formattedBounds.end);

        this.$emit('updated', {
          start: start,
          end: end
        });
      }

      if ($event) {
        $event.preventDefault();

        return false;
      }
    },
    submitForm() {
      // Allow Vue model to catch up to user input.
      // Submitting form will cause validation messages to display (but only if triggered by button click)
      this.$nextTick(() => this.setBoundsFromView());
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
          start: this.timeFormatter.parse(this.formattedBounds.start),
          end: this.timeFormatter.parse(this.formattedBounds.end)
        };
        //TODO: Do we need limits here? We have conductor limits disabled right now
        // const limit = this.getBoundsLimit();
        const limit = false;

        if (this.timeSystem.isUTCBased && limit && boundsValues.end - boundsValues.start > limit) {
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
          input === this.$refs.startDate ? this.formattedBounds.start : this.formattedBounds.end;
        if (!this.timeFormatter.validate(formattedDate)) {
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
      } else {
        input.setCustomValidity('');
        input.title = '';
      }

      this.$refs.fixedDeltaInput.reportValidity();

      return validationResult.valid;
    },
    startDateSelected(date) {
      this.formattedBounds.start = this.timeFormatter.format(date);
      this.validateAllBounds('startDate');
      this.submitForm();
    },
    endDateSelected(date) {
      this.formattedBounds.end = this.timeFormatter.format(date);
      this.validateAllBounds('endDate');
      this.submitForm();
    }
  }
};
</script>
