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
  <form ref="deltaInput" class="c-conductor__inputs">
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__start-delta">
      <!-- RT start -->
      <div class="c-direction-indicator icon-minus"></div>
      <time-popup
        v-if="showTCInputStart"
        class="pr-tc-input-menu--start"
        :bottom="keyString !== undefined"
        :type="'start'"
        :offset="offsets.start"
        @focus.native="$event.target.select()"
        @hide="hideAllTimePopups"
        @update="timePopUpdate"
      />
      <button
        ref="startOffset"
        class="c-button c-conductor__delta-button"
        title="Set the time offset after now"
        data-testid="conductor-start-offset-button"
        @click.prevent.stop="showTimePopupStart"
      >
        {{ offsets.start }}
      </button>
    </div>
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-fixed">
      <!-- RT 'last update' display -->
      <div class="c-conductor__end-fixed__label">Current</div>
      <input
        ref="endDate"
        v-model="formattedCurrentValue"
        class="c-input--datetime"
        type="text"
        autocorrect="off"
        spellcheck="false"
        :disabled="true"
      />
    </div>
    <div class="c-ctrl-wrapper c-conductor-input c-conductor__end-delta">
      <!-- RT end -->
      <div class="c-direction-indicator icon-plus"></div>
      <time-popup
        v-if="showTCInputEnd"
        class="pr-tc-input-menu--end"
        :bottom="keyString !== undefined"
        :type="'end'"
        :offset="offsets.end"
        @focus.native="$event.target.select()"
        @hide="hideAllTimePopups"
        @update="timePopUpdate"
      />
      <button
        ref="endOffset"
        class="c-button c-conductor__delta-button"
        title="Set the time offset preceding now"
        data-testid="conductor-end-offset-button"
        @click.prevent.stop="showTimePopupEnd"
      >
        {{ offsets.end }}
      </button>
    </div>
  </form>
</template>

<script>
import timePopup from './timePopup.vue';
import _ from 'lodash';

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
  components: {
    timePopup
  },
  inject: ['openmct'],
  props: {
    keyString: {
      type: String,
      default() {
        return undefined;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    },
    inputBounds: {
      type: Object,
      default() {
        return undefined;
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
    let offsets = this.openmct.time.clockOffsets();
    let currentValue = this.openmct.time.clock()?.currentValue();

    return {
      showTCInputStart: false,
      showTCInputEnd: false,
      durationFormatter,
      timeFormatter,
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      offsets: {
        start: offsets && durationFormatter.format(Math.abs(offsets.start)),
        end: offsets && durationFormatter.format(Math.abs(offsets.end))
      },
      formattedBounds: {
        start: timeFormatter.format(bounds.start),
        end: timeFormatter.format(bounds.end)
      },
      currentValue,
      formattedCurrentValue: timeFormatter.format(currentValue),
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
    this.openmct.time.off('timeSystem', this.setTimeSystem);
    this.stopFollowingTime();
  },
  methods: {
    followTime() {
      this.handleNewBounds(this.timeContext.bounds());
      this.setViewFromOffsets(this.timeContext.clockOffsets());
      this.timeContext.on('bounds', this.handleNewBounds);
      this.timeContext.on('clock', this.clearAllValidation);
      this.timeContext.on('clockOffsets', this.setViewFromOffsets);
    },
    stopFollowingTime() {
      if (this.timeContext) {
        this.timeContext.off('bounds', this.handleNewBounds);
        this.timeContext.off('clock', this.clearAllValidation);
        this.timeContext.off('clockOffsets', this.setViewFromOffsets);
      }
    },
    setTimeContext() {
      this.stopFollowingTime();
      this.timeContext = this.openmct.time.getContextForView(this.keyString ? this.objectPath : []);
      this.followTime();
    },
    handleNewBounds(bounds) {
      this.setBounds(bounds);
      this.setViewFromBounds(bounds);
      this.updateCurrentValue();
    },
    clearAllValidation() {
      [this.$refs.startOffset, this.$refs.endOffset].forEach(this.clearValidationForInput);
    },
    clearValidationForInput(input) {
      input.setCustomValidity('');
      input.title = '';
    },
    setViewFromOffsets(offsets) {
      if (offsets) {
        this.offsets.start = this.durationFormatter.format(Math.abs(offsets.start));
        this.offsets.end = this.durationFormatter.format(Math.abs(offsets.end));
      }
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setViewFromBounds(bounds) {
      this.formattedBounds.start = this.timeFormatter.format(bounds.start);
      this.formattedBounds.end = this.timeFormatter.format(bounds.end);
    },
    updateCurrentValue() {
      const currentValue = this.openmct.time.clock()?.currentValue();

      if (currentValue !== undefined) {
        this.setCurrentValue(currentValue);
      }
    },
    setCurrentValue(value) {
      this.currentValue = value;
      this.formattedCurrentValue = this.timeFormatter.format(value);
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
    hideAllTimePopups() {
      this.showTCInputStart = false;
      this.showTCInputEnd = false;
    },
    showTimePopupStart() {
      this.hideAllTimePopups();
      this.showTCInputStart = !this.showTCInputStart;
    },
    showTimePopupEnd() {
      this.hideAllTimePopups();
      this.showTCInputEnd = !this.showTCInputEnd;
    },
    timePopUpdate({ type, hours, minutes, seconds }) {
      this.offsets[type] = [hours, minutes, seconds].join(':');
      this.setOffsetsFromView();
      this.hideAllTimePopups();
    },
    setOffsetsFromView($event) {
      if (this.$refs.deltaInput.checkValidity()) {
        let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
        let endOffset = this.durationFormatter.parse(this.offsets.end);

        this.$emit('updated', {
          start: startOffset,
          end: endOffset
        });
      }

      if ($event) {
        $event.preventDefault();

        return false;
      }
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
    handleValidationResults(input, validationResult) {
      if (validationResult.valid !== true) {
        input.setCustomValidity(validationResult.message);
        input.title = validationResult.message;
      } else {
        input.setCustomValidity('');
        input.title = '';
      }

      return validationResult.valid;
    }
  }
};
</script>
