<template>
  <form ref="fixedDeltaInput">
    <div class="c-tc-input-popup__input-grid">
      <div class="pr-time-label pr-time-label-start-date"><em>Start</em> Date</div>
      <div class="pr-time-label pr-time-label-start-time">Time</div>
      <div class="pr-time-label pr-time-label-end-date"><em>End</em> Date</div>
      <div class="pr-time-label pr-time-label-end-time">Time</div>

      <div
        class="pr-time-input pr-time-input--date pr-time-input--input-and-button pr-time-input-start-date"
      >
        <input
          ref="startDate"
          v-model="formattedBounds.startDate"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="Start date"
          @change="validateInput('startDate')"
        />
        <DatePicker
          v-if="isUTCBased"
          class="c-ctrl-wrapper--menus-right"
          :default-date-time="formattedBounds.startDate"
          :formatter="timeFormatter"
          @date-selected="startDateSelected"
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
          @change="validateInput('startTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div
        class="pr-time-input pr-time-input--date pr-time-input--input-and-button pr-time-input-end-date"
      >
        <input
          ref="endDate"
          v-model="formattedBounds.endDate"
          class="c-input--datetime"
          type="text"
          autocorrect="off"
          spellcheck="false"
          aria-label="End date"
          @change="validateInput('endDate')"
        />
        <DatePicker
          v-if="isUTCBased"
          class="c-ctrl-wrapper--menus-left"
          :default-date-time="formattedBounds.endDate"
          :formatter="timeFormatter"
          @date-selected="endDateSelected"
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
          @change="validateInput('endTime')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="isSubmitDisabled"
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
  emits: ['update', 'dismiss'],
  data() {
    const timeSystem = this.openmct.time.getTimeSystem();
    const bounds = this.openmct.time.getBounds();

    return {
      timeFormatter: this.getFormatter(timeSystem.timeFormat),
      durationFormatter: this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER),
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      formattedBounds: {
        start: '',
        end: '',
        startTime: '',
        endTime: ''
      },
      isUTCBased: timeSystem.isUTCBased,
      inputValidityMap: {
        startDate: true,
        startTime: true,
        endDate: true,
        endTime: true
      },
      isDisabled: false
    };
  },
  computed: {
    isSubmitDisabled() {
      return Object.values(this.inputValidityMap).some((isValid) => !isValid);
    }
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
  created() {
    this.handleNewBounds = _.throttle(this.handleNewBounds, 300);
  },
  mounted() {
    this.setTimeSystem(JSON.parse(JSON.stringify(this.openmct.time.getTimeSystem())));
    this.setViewFromBounds(this.bounds);
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
      if (input) {
        input.setCustomValidity('');
        input.title = '';
      }
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setViewFromBounds(bounds) {
      this.formattedBounds.startDate = this.timeFormatter.format(bounds.start).split(' ')[0];
      this.formattedBounds.endDate = this.timeFormatter.format(bounds.end).split(' ')[0];
      this.formattedBounds.startTime = this.durationFormatter.format(Math.abs(bounds.start));
      this.formattedBounds.endTime = this.durationFormatter.format(Math.abs(bounds.end));
    },
    setTimeSystem(timeSystem) {
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
          `${this.formattedBounds.startDate} ${this.formattedBounds.startTime}`
        );
        let end = this.timeFormatter.parse(
          `${this.formattedBounds.endDate} ${this.formattedBounds.endTime}`
        );

        this.$emit('update', { start, end });
      }

      if (dismiss) {
        this.$emit('dismiss');
        return false;
      }
    },
    handleFormSubmission(shouldDismiss) {
      this.validateAllBounds('startDate');
      this.validateAllBounds('startTime');
      this.validateAllBounds('endDate');
      this.validateAllBounds('endTime');

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

      return [this.$refs.startDate, this.$refs.endDate].every((input) => {
        let boundsValues = {
          start: this.timeFormatter.parse(
            `${this.formattedBounds.startDate} ${this.formattedBounds.startTime}`
          ),
          end: this.timeFormatter.parse(
            `${this.formattedBounds.endDate} ${this.formattedBounds.endTime}`
          )
        };
        //TODO: Do we need limits here? We have conductor limits disabled right now
        // const limit = this.getBoundsLimit();
        const limit = false;

        if (this.isUTCBased && limit && boundsValues.end - boundsValues.start > limit) {
          if (input === currentInput) {
            validationResult = {
              valid: false,
              message: 'Start and end difference exceeds allowable limit'
            };
          }
        } else if (input === currentInput) {
          validationResult = this.openmct.time.validateBounds(boundsValues);
        }

        return this.handleValidationResults(input, validationResult);
      });
    },
    validateInput(refName) {
      const inputType = refName.includes('Date') ? 'Date' : 'Time';
      const formatter = inputType === 'Date' ? this.timeFormatter : this.durationFormatter;
      const validationResult = formatter.validate(this.formattedBounds[refName])
        ? { valid: true }
        : { valid: false, message: `Invalid ${inputType}` };

      this.inputValidityMap[refName] = validationResult.valid;

      return this.handleValidationResults(this.$refs[refName], validationResult);
    },
    areBoundsFormatsValid() {
      return [this.$refs.startDate, this.$refs.endDate].every((input) => {
        const formattedDate =
          input === this.$refs.startDate
            ? `${this.formattedBounds.startDate} ${this.formattedBounds.startTime}`
            : `${this.formattedBounds.endDate} ${this.formattedBounds.endTime}`;

        const validationResult = this.timeFormatter.validate(formattedDate)
          ? { valid: true }
          : { valid: false, message: 'Invalid date' };

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
    startDateSelected(date) {
      this.formattedBounds.startDate = this.timeFormatter.format(date).split(' ')[0];
      this.validateInput('startDate');
    },
    endDateSelected(date) {
      this.formattedBounds.endDate = this.timeFormatter.format(date).split(' ')[0];
      this.validateInput('endDate');
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    }
  }
};
</script>
