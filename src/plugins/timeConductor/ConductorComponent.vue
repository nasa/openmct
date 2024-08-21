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
  <div
    ref="timeConductorOptionsHolder"
    class="c-compact-tc is-expanded"
    :class="[
      { 'is-zooming': isZooming },
      { 'is-panning': isPanning },
      { 'alt-pressed': altPressed },
      isFixedTimeMode ? 'is-fixed-mode' : 'is-realtime-mode'
    ]"
  >
    <ConductorModeIcon class="c-conductor__mode-icon" />
    <div class="c-compact-tc__setting-value u-fade-truncate">
      <ConductorMode :read-only="true" />
      <ConductorClock :read-only="true" />
      <ConductorTimeSystem :read-only="true" />
    </div>
    <ConductorInputsFixed v-if="isFixedTimeMode" :input-bounds="viewBounds" :read-only="true" />
    <ConductorInputsRealtime v-else :input-bounds="viewBounds" :read-only="true" />
    <ConductorAxis
      v-if="isFixedTimeMode"
      class="c-conductor__ticks"
      :view-bounds="viewBounds"
      :alt-pressed="altPressed"
      @end-pan="endPan"
      @end-zoom="endZoom"
      @pan-axis="pan"
      @zoom-axis="zoom"
    />
    <ConductorHistory
      v-if="!isIndependent"
      class="c-conductor__history-select"
      title="Select and apply previously entered time intervals."
    />
    <ConductorPopUp
      v-if="showConductorPopup"
      ref="conductorPopup"
      :bottom="false"
      :position-x="positionX"
      :position-y="positionY"
      @popup-loaded="initializePopup"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import { inject, provide } from 'vue';

import ConductorAxis from './ConductorAxis.vue';
import ConductorClock from './ConductorClock.vue';
import ConductorHistory from './ConductorHistory.vue';
import ConductorInputsFixed from './ConductorInputsFixed.vue';
import ConductorInputsRealtime from './ConductorInputsRealtime.vue';
import ConductorMode from './ConductorMode.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';
import ConductorPopUp from './ConductorPopUp.vue';
import conductorPopUpManager from './conductorPopUpManager.js';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import { useClock } from './useClock.js';
import { useClockOffsets } from './useClockOffsets.js';
import { useTimeBounds } from './useTimeBounds.js';
import { useTimeContext } from './useTimeContext.js';
import { useTimeMode } from './useTimeMode.js';
import { useTimeSystem } from './useTimeSystem.js';

export default {
  components: {
    ConductorTimeSystem,
    ConductorClock,
    ConductorMode,
    ConductorHistory,
    ConductorInputsRealtime,
    ConductorInputsFixed,
    ConductorAxis,
    ConductorModeIcon,
    ConductorPopUp
  },
  mixins: [conductorPopUpManager],
  inject: ['openmct', 'configuration'],
  setup(props) {
    const openmct = inject('openmct');
    const { timeContext } = useTimeContext(openmct);
    const { timeSystemFormatter, timeSystemDurationFormatter, isTimeSystemUTCBased } =
      useTimeSystem(openmct, timeContext);
    const { timeMode, isFixedTimeMode, isRealTimeMode, getAllModeMetadata, getModeMetadata } =
      useTimeMode(openmct, timeContext);
    const { bounds, isTick } = useTimeBounds(openmct, timeContext);
    const { clock, getAllClockMetadata, getClockMetadata } = useClock(openmct, timeContext);
    const { offsets } = useClockOffsets(openmct, timeContext);

    provide('timeSystemFormatter', timeSystemFormatter);
    provide('timeSystemDurationFormatter', timeSystemDurationFormatter);
    provide('isTimeSystemUTCBased', isTimeSystemUTCBased);
    provide('timeContext', timeContext);
    provide('timeMode', timeMode);
    provide('isFixedTimeMode', isFixedTimeMode);
    provide('isRealTimeMode', isRealTimeMode);
    provide('getAllModeMetadata', getAllModeMetadata);
    provide('getModeMetadata', getModeMetadata);
    provide('bounds', bounds);
    provide('isTick', isTick);
    provide('offsets', offsets);
    provide('clock', clock);
    provide('getAllClockMetadata', getAllClockMetadata);
    provide('getClockMetadata', getClockMetadata);

    return {
      timeSystemFormatter,
      isFixedTimeMode,
      bounds
    };
  },
  data() {
    return {
      viewBounds: {
        start: this.bounds.start,
        end: this.bounds.end
      },
      showDatePicker: false,
      showConductorPopup: false,
      altPressed: false,
      isPanning: false,
      isZooming: false
    };
  },
  computed: {
    formattedBounds() {
      return {
        start: this.timeSystemFormatter.format(this.bounds.start),
        end: this.timeSystemFormatter.format(this.bounds.end)
      };
    }
  },
  watch: {
    bounds: {
      handler() {
        this.setViewBounds(this.bounds);
      },
      deep: true
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  },
  methods: {
    handleKeyDown(event) {
      if (event.key === 'Alt') {
        this.altPressed = true;
      }
    },
    handleKeyUp(event) {
      if (event.key === 'Alt') {
        this.altPressed = false;
      }
    },
    pan(bounds) {
      this.isPanning = true;
      this.setViewBounds(bounds);
    },
    endPan(bounds) {
      this.isPanning = false;
      if (bounds) {
        this.openmct.time.setBounds(bounds);
      }
    },
    zoom(bounds) {
      if (isNaN(bounds.start) || isNaN(bounds.end)) {
        this.isZooming = false;
      } else {
        this.isZooming = true;
        this.formattedBounds.start = this.timeSystemFormatter.format(bounds.start);
        this.formattedBounds.end = this.timeSystemFormatter.format(bounds.end);
      }
    },
    endZoom(bounds) {
      this.isZooming = false;
      if (bounds) {
        this.openmct.time.setBounds(bounds);
      } else {
        this.setViewBounds(this.bounds);
      }
    },
    setViewBounds(bounds) {
      this.viewBounds.start = bounds.start;
      this.viewBounds.end = bounds.end;
    }
  }
};
</script>
