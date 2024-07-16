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
      <conductor-mode :read-only="true" />
      <conductor-clock :read-only="true" />
      <conductor-time-system :read-only="true" />
    </div>
    <conductor-inputs-fixed v-if="isFixedTimeMode" :input-bounds="viewBounds" :read-only="true" />
    <conductor-inputs-realtime v-else :input-bounds="viewBounds" :read-only="true" />
    <conductor-axis
      v-if="isFixedTimeMode"
      class="c-conductor__ticks"
      :view-bounds="viewBounds"
      :alt-pressed="altPressed"
      @end-pan="endPan"
      @end-zoom="endZoom"
      @pan-axis="pan"
      @zoom-axis="zoom"
    />
    <div
      role="button"
      class="c-not-button c-not-button--compact c-compact-tc__gear icon-gear"
      aria-label="Time Conductor Settings"
    ></div>

    <conductor-pop-up
      v-if="showConductorPopup"
      ref="conductorPopup"
      :bottom="false"
      :position-x="positionX"
      :position-y="positionY"
      @popup-loaded="initializePopup"
      @clock-updated="saveClock"
      @fixed-bounds-updated="saveFixedBounds"
      @clock-offsets-updated="saveClockOffsets"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import { inject, onMounted, provide } from 'vue';

import { FIXED_MODE_KEY, REALTIME_MODE_KEY } from '../../api/time/constants.js';
import ConductorAxis from './ConductorAxis.vue';
import ConductorClock from './ConductorClock.vue';
import ConductorInputsFixed from './ConductorInputsFixed.vue';
import ConductorInputsRealtime from './ConductorInputsRealtime.vue';
import ConductorMode from './ConductorMode.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';
import ConductorPopUp from './ConductorPopUp.vue';
import conductorPopUpManager from './conductorPopUpManager';
import ConductorTimeSystem from './ConductorTimeSystem.vue';
import { useClockOffsets } from './useClockOffsets.js';
import { useTimeBounds } from './useTimeBounds.js';
import { useTimeMode } from './useTimeMode.js';
import { useTimeSystem } from './useTimeSystem.js';

export default {
  components: {
    ConductorTimeSystem,
    ConductorClock,
    ConductorMode,
    ConductorInputsRealtime,
    ConductorInputsFixed,
    ConductorAxis,
    ConductorModeIcon,
    ConductorPopUp
  },
  mixins: [conductorPopUpManager],
  inject: ['openmct', 'configuration'],
  setup() {
    const openmct = inject('openmct');
    const { observeTimeSystem, timeSystemFormatter, timeSystemDurationFormatter } = useTimeSystem(openmct);
    const { observeTimeMode, timeMode, isFixedTimeMode, isRealTimeMode } = useTimeMode(openmct);
    const { observeTimeBounds, bounds, isTick } = useTimeBounds(openmct);
    const { observeClockOffsets, offsets } = useClockOffsets(openmct);

    onMounted(() => {
      observeTimeSystem();
      observeTimeMode();
      observeTimeBounds();
      observeClockOffsets();
    });

    provide('timeSystemFormatter', timeSystemFormatter);
    provide('timeSystemDurationFormatter', timeSystemDurationFormatter);
    provide('timeMode', timeMode);
    provide('isFixedTimeMode', isFixedTimeMode);
    provide('isRealTimeMode', isRealTimeMode);
    provide('bounds', bounds);
    provide('isTick', isTick);
    provide('offsets', offsets);

    return {
      timeSystemFormatter,
      timeSystemDurationFormatter,
      isFixedTimeMode,
      isRealTimeMode,
      bounds,
      isTick
    };
  },
  data() {

    return {
      // offsets: {
      //   start: offsets && this.durationFormatter.format(Math.abs(offsets.start)),
      //   end: offsets && this.durationFormatter.format(Math.abs(offsets.end))
      // },
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
    },
    mode() {
      return this.isFixedTimeMode ? FIXED_MODE_KEY : REALTIME_MODE_KEY;
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
        this.formattedBounds.start = this.timeFormatter.format(bounds.start);
        this.formattedBounds.end = this.timeFormatter.format(bounds.end);
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
      // this.formattedBounds.start = this.timeFormatter.format(bounds.start);
      // this.formattedBounds.end = this.timeFormatter.format(bounds.end);
      this.viewBounds.start = bounds.start;
      this.viewBounds.end = bounds.end;
    },
    saveFixedBounds(bounds) {
      // this.openmct.time.setBounds(bounds);
    },
    saveClockOffsets(offsets) {
      // this.openmct.time.setClockOffsets(offsets);
    },
    saveClock(clockOptions) {
      this.openmct.time.setClock(clockOptions.clockKey);
    }
  }
};
</script>
