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
        <date-picker
          v-if="isUTCBased"
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.start"
          :formatter="timeFormatter"
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
        <date-picker
          v-if="isUTCBased"
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.end"
          :formatter="timeFormatter"
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
import _ from 'lodash';

import DatePicker from './DatePicker.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
  components: {
    DatePicker
  },
  inject: ['openmct'],
  props: {
    inputBounds: {
      type: Object,
      required: true
    },
    inputTimeSystem: {
      type: Object,
      required: true
    }
  },
  data() {
    let timeSystem = this.openmct.time.getTimeSystem();
    let durationFormatter = this.getFormatter(
      timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );
    let timeFormatter = this.getFormatter(timeSystem.timeFormat);
    let bounds = this.bounds || this.openmct.time.getBounds();

    return {
      timeFormatter,
      durationFormatter,
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      formattedBounds: {
        start: timeFormatter.format(bounds.start).split(' ')[0],
        end: timeFormatter.format(bounds.end).split(' ')[0],
        startTime: durationFormatter.format(Math.abs(bounds.start)),
        endTime: durationFormatter.format(Math.abs(bounds.end))
      },
      isUTCBased: timeSystem.isUTCBased,
      isDisabled: false
    };
  },
  watch: {
    inputBounds: {
      handler(newBounds) {
        this.handleNewBounds(newBounds);
      },
      deep: true
    },
    inputTimeSystem: {
      handler(newTimeSystem) {
        this.setTimeSystem(newTimeSystem);
      },
      deep: true
    }
  },
  mounted() {
    this.handleNewBounds = _.throttle(this.handleNewBounds, 300);
    this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.getTimeSystem())));
  },
  beforeUnmount() {
    this.clearAllValidation();
  },
  methods: {
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
      this.formattedBounds.start = this.timeFormatter.format(bounds.start).split(' ')[0];
      this.formattedBounds.end = this.timeFormatter.format(bounds.end).split(' ')[0];
      this.formattedBounds.startTime = this.durationFormatter.format(Math.abs(bounds.start));
      this.formattedBounds.endTime = this.durationFormatter.format(Math.abs(bounds.end));
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
    setBoundsFromView(dismiss) {
      if (this.$refs.fixedDeltaInput.checkValidity()) {
        let start = this.timeFormatter.parse(
          `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
        );
        let end = this.timeFormatter.parse(
          `${this.formattedBounds.end} ${this.formattedBounds.endTime}`
        );

        this.$emit('update', {
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
          start: this.timeFormatter.parse(
            `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
          ),
          end: this.timeFormatter.parse(
            `${this.formattedBounds.end} ${this.formattedBounds.endTime}`
          )
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
          input === this.$refs.startDate
            ? `${this.formattedBounds.start} ${this.formattedBounds.startTime}`
            : `${this.formattedBounds.end} ${this.formattedBounds.endTime}`;
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
      this.formattedBounds.start = this.timeFormatter.format(date).split(' ')[0];
      this.validateAllBounds('startDate');
    },
    endDateSelected(date) {
      this.formattedBounds.end = this.timeFormatter.format(date).split(' ')[0];
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
