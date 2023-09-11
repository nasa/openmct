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
  <time-popup-realtime
    v-if="readOnly === false"
    :offsets="offsets"
    @focus="$event.target.select()"
    @update="timePopUpdate"
    @dismiss="dismiss"
  />
  <div v-else class="c-compact-tc__setting-wrapper">
    <div
      v-if="!compact"
      class="c-compact-tc__setting-value icon-minus u-fade-truncate--lg --no-sep"
      :title="`Start offset: ${offsets.start}`"
    >
      {{ offsets.start }}
    </div>
    <div v-if="!compact" class="c-compact-tc__bounds__start-end-sep icon-arrows-right-left"></div>
    <div
      v-if="!compact"
      class="c-compact-tc__setting-value icon-plus u-fade-truncate--lg"
      :class="{ '--no-sep': compact }"
      :title="`End offset: ${offsets.end}`"
    >
      {{ offsets.end }}
    </div>
    <div
      class="c-compact-tc__setting-value icon-clock c-compact-tc__current-update u-fade-truncate--lg --no-sep"
      title="Last update"
    >
      {{ formattedCurrentValue }}
    </div>
    <div class="u-flex-spreader"></div>
  </div>
</template>

<script>
import _ from 'lodash';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants';
import TimePopupRealtime from './timePopupRealtime.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
  components: {
    TimePopupRealtime
  },
  inject: ['openmct'],
  props: {
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
    },
    readOnly: {
      type: Boolean,
      default() {
        return false;
      }
    },
    compact: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  data() {
    const timeSystem = this.openmct.time.getTimeSystem();
    const durationFormatter = this.getFormatter(
      timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );
    const timeFormatter = this.getFormatter(timeSystem.timeFormat);
    const bounds = this.bounds ?? this.openmct.time.getBounds();
    const offsets = this.offsets ?? this.openmct.time.getClockOffsets();
    const currentValue = this.openmct.time.getClock()?.currentValue();

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
    objectPath: {
      handler(newPath, oldPath) {
        if (newPath === oldPath) {
          return;
        }

        this.setTimeContext();
      },
      deep: true
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
    this.setTimeSystem(this.copy(this.openmct.time.getTimeSystem()));
    this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.setTimeContext();
  },
  beforeUnmount() {
    this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.stopFollowingTime();
  },
  methods: {
    followTime() {
      const bounds = this.timeContext
        ? this.timeContext.getBounds()
        : this.openmct.time.getBounds();
      const offsets = this.timeContext
        ? this.timeContext.getClockOffsets()
        : this.openmct.time.getClockOffsets();

      this.handleNewBounds(bounds);
      this.setViewFromOffsets(offsets);

      if (this.timeContext) {
        this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
        this.timeContext.on(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.setViewFromOffsets);
      } else {
        this.openmct.time.on(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
        this.openmct.time.on(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.setViewFromOffsets);
      }
    },
    stopFollowingTime() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
        this.timeContext.off(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.setViewFromOffsets);
      } else {
        this.openmct.time.off(TIME_CONTEXT_EVENTS.boundsChanged, this.handleNewBounds);
        this.openmct.time.off(TIME_CONTEXT_EVENTS.clockOffsetsChanged, this.setViewFromOffsets);
      }
    },
    setTimeContext() {
      this.stopFollowingTime();
      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.followTime();
    },
    handleNewBounds(bounds, isTick) {
      if (this.timeContext.isRealTime() || !isTick) {
        this.setBounds(bounds);
        this.setViewFromBounds(bounds);
        this.updateCurrentValue();
      }
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
      const currentValue = this.openmct.time.getClock()?.currentValue();

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
    timePopUpdate({ start, end }) {
      this.offsets.start = [start.hours, start.minutes, start.seconds].join(':');
      this.offsets.end = [end.hours, end.minutes, end.seconds].join(':');
      this.setOffsetsFromView();
    },
    setOffsetsFromView() {
      let startOffset = 0 - this.durationFormatter.parse(this.offsets.start);
      let endOffset = this.durationFormatter.parse(this.offsets.end);

      this.$emit('offsetsUpdated', {
        start: startOffset,
        end: endOffset
      });
    },
    dismiss() {
      this.$emit('dismissInputsRealtime');
    },
    copy(object) {
      return JSON.parse(JSON.stringify(object));
    }
  }
};
</script>
