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
      isFixed ? 'is-fixed-mode' : 'is-realtime-mode'
    ]"
  >
    <ConductorModeIcon class="c-conductor__mode-icon" />
    <div class="c-compact-tc__setting-value u-fade-truncate">
      <conductor-mode :mode="mode" :read-only="true" />
      <conductor-clock :read-only="true" />
      <conductor-time-system :read-only="true" />
    </div>
    <conductor-inputs-fixed v-if="isFixed" :input-bounds="viewBounds" :read-only="true" />
    <conductor-inputs-realtime v-else :input-bounds="viewBounds" :read-only="true" />
    <conductor-axis
      v-if="isFixed"
      class="c-conductor__ticks"
      :view-bounds="viewBounds"
      :is-fixed="isFixed"
      :alt-pressed="altPressed"
      @endPan="endPan"
      @endZoom="endZoom"
      @panAxis="pan"
      @zoomAxis="zoom"
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
      :is-fixed="isFixed"
      @popupLoaded="initializePopup"
      @modeUpdated="saveMode"
      @clockUpdated="saveClock"
      @fixedBoundsUpdated="saveFixedBounds"
      @clockOffsetsUpdated="saveClockOffsets"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import _ from 'lodash';

import {
  FIXED_MODE_KEY,
  MODES,
  REALTIME_MODE_KEY,
  TIME_CONTEXT_EVENTS
} from '../../api/time/constants';
import ConductorAxis from './ConductorAxis.vue';
import ConductorClock from './ConductorClock.vue';
import ConductorInputsFixed from './ConductorInputsFixed.vue';
import ConductorInputsRealtime from './ConductorInputsRealtime.vue';
import ConductorMode from './ConductorMode.vue';
import ConductorModeIcon from './ConductorModeIcon.vue';
import ConductorPopUp from './ConductorPopUp.vue';
import conductorPopUpManager from './conductorPopUpManager';
import ConductorTimeSystem from './ConductorTimeSystem.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';

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
  data() {
    const isFixed = this.openmct.time.isFixed();
    const bounds = this.openmct.time.getBounds();
    const offsets = this.openmct.time.getClockOffsets();
    const timeSystem = this.openmct.time.getTimeSystem();
    const timeFormatter = this.getFormatter(timeSystem.timeFormat);
    const durationFormatter = this.getFormatter(
      timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );

    return {
      timeSystem,
      timeFormatter,
      durationFormatter,
      offsets: {
        start: offsets && durationFormatter.format(Math.abs(offsets.start)),
        end: offsets && durationFormatter.format(Math.abs(offsets.end))
      },
      bounds: {
        start: bounds.start,
        end: bounds.end
      },
      formattedBounds: {
        start: timeFormatter.format(bounds.start),
        end: timeFormatter.format(bounds.end)
      },
      viewBounds: {
        start: bounds.start,
        end: bounds.end
      },
      isFixed,
      isUTCBased: timeSystem.isUTCBased,
      showDatePicker: false,
      showConductorPopup: false,
      altPressed: false,
      isPanning: false,
      isZooming: false
    };
  },
  computed: {
    mode() {
      return this.isFixed ? FIXED_MODE_KEY : REALTIME_MODE_KEY;
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    this.setTimeSystem(this.copy(this.openmct.time.getTimeSystem()));

    this.openmct.time.on(TIME_CONTEXT_EVENTS.boundsChanged, _.throttle(this.handleNewBounds, 300));
    this.openmct.time.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.openmct.time.on(TIME_CONTEXT_EVENTS.modeChanged, this.setMode);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);

    this.openmct.time.off(TIME_CONTEXT_EVENTS.boundsChanged, _.throttle(this.handleNewBounds, 300));
    this.openmct.time.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.setTimeSystem);
    this.openmct.time.off(TIME_CONTEXT_EVENTS.modeChanged, this.setMode);
  },
  methods: {
    handleNewBounds(bounds, isTick) {
      if (this.openmct.time.isRealTime() || !isTick) {
        this.setBounds(bounds);
        this.setViewFromBounds(bounds);
      }
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
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
      this.setViewFromBounds(bounds);
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
        this.setViewFromBounds(this.bounds);
      }
    },
    setTimeSystem(timeSystem) {
      this.timeSystem = timeSystem;
      this.timeFormatter = this.getFormatter(timeSystem.timeFormat);
      this.durationFormatter = this.getFormatter(
        timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
      );
      this.isUTCBased = timeSystem.isUTCBased;
    },
    setMode() {
      this.isFixed = this.openmct.time.isFixed();
    },
    setViewFromBounds(bounds) {
      this.formattedBounds.start = this.timeFormatter.format(bounds.start);
      this.formattedBounds.end = this.timeFormatter.format(bounds.end);
      this.viewBounds.start = bounds.start;
      this.viewBounds.end = bounds.end;
    },
    getFormatter(key) {
      return this.openmct.telemetry.getValueFormatter({
        format: key
      }).formatter;
    },
    getBoundsForMode(mode) {
      const isRealTime = mode === MODES.realtime;
      return isRealTime ? this.openmct.time.getClockOffsets() : this.openmct.time.getBounds();
    },
    saveFixedBounds(bounds) {
      this.openmct.time.setBounds(bounds);
    },
    saveClockOffsets(offsets) {
      this.openmct.time.setClockOffsets(offsets);
    },
    saveClock(clockOptions) {
      this.openmct.time.setClock(clockOptions.clockKey);
    },
    saveMode(mode) {
      this.openmct.time.setMode(mode, this.getBoundsForMode(mode));
    },
    copy(object) {
      return JSON.parse(JSON.stringify(object));
    }
  }
};
</script>
