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
    class="c-compact-tc"
    :class="[
      isFixedTimeMode ? 'is-fixed-mode' : independentTCEnabled ? 'is-realtime-mode' : 'is-fixed-mode',
      { 'is-expanded': independentTCEnabled }
    ]"
    aria-label="Independent Time Conductor Panel"
  >
    <ToggleSwitch
      id="independentTCToggle"
      class="c-toggle-switch--mini"
      :checked="independentTCEnabled"
      :name="toggleTitle"
      @change="toggleIndependentTC"
    />

    <ConductorModeIcon />

    <ConductorInputsFixed
      v-if="showFixedInputs"
      class="c-compact-tc__bounds--fixed"
      :object-path="objectPath"
      :read-only="true"
      :compact="true"
    />

    <ConductorInputsRealtime
      v-if="showRealtimeInputs"
      class="c-compact-tc__bounds--real-time"
      :object-path="objectPath"
      :read-only="true"
      :compact="true"
    />
    <div
      v-if="independentTCEnabled"
      role="button"
      class="c-not-button c-not-button--compact c-compact-tc__gear icon-gear"
      aria-label="Independent Time Conductor Settings"
    ></div>

    <ConductorPopUp
      v-if="showConductorPopup"
      ref="conductorPopup"
      :object-path="objectPath"
      :is-independent="true"
      :time-options="timeOptions"
      :is-fixed="isFixedTimeMode"
      :bottom="true"
      :position-x="positionX"
      :position-y="positionY"
      @popup-loaded="initializePopup"
      @independent-mode-updated="saveMode"
      @independent-clock-updated="saveClock"
      @fixed-bounds-updated="saveFixedBounds"
      @clock-offsets-updated="saveClockOffsets"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import { inject, provide, watch } from 'vue';

import ConductorModeIcon from '@/plugins/timeConductor/ConductorModeIcon.vue';

import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import ConductorInputsFixed from '../ConductorInputsFixed.vue';
import ConductorInputsRealtime from '../ConductorInputsRealtime.vue';
import ConductorPopUp from '../ConductorPopUp.vue';
import { useClock } from '../useClock.js';
import { useClockOffsets } from '../useClockOffsets.js';
import { useTimeBounds } from '../useTimeBounds.js';
import { useTimeContext } from '../useTimeContext.js';
import { useTimeMode } from '../useTimeMode.js';
import { useTimeSystem } from '../useTimeSystem.js';
import independentTimeConductorPopUpManager from './independentTimeConductorPopUpManager.js';

export default {
  components: {
    ConductorModeIcon,
    ConductorInputsRealtime,
    ConductorInputsFixed,
    ConductorPopUp,
    ToggleSwitch
  },
  mixins: [independentTimeConductorPopUpManager],
  inject: ['openmct'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const openmct = inject('openmct');
    const { timeContext } = useTimeContext(openmct, getReactiveObjectPath);

    const { timeSystemFormatter, timeSystemDurationFormatter, isTimeSystemUTCBased } =
      useTimeSystem(openmct, getReactiveObjectPath);
    const { timeMode, isFixedTimeMode, isRealTimeMode, getAllModeMetadata, getModeMetadata } =
      useTimeMode(openmct, getReactiveObjectPath);
    const { bounds, isTick } = useTimeBounds(openmct, getReactiveObjectPath);
    const { clock, getAllClockMetadata, getClockMetadata } = useClock(openmct, getReactiveObjectPath);
    const { offsets } = useClockOffsets(openmct, getReactiveObjectPath);

    watch(timeContext, () => {
      console.log('context changed');
    });

    provide('timeContext', timeContext);
    provide('timeSystemFormatter', timeSystemFormatter);
    provide('timeSystemDurationFormatter', timeSystemDurationFormatter);
    provide('isTimeSystemUTCBased', isTimeSystemUTCBased);
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

    function getReactiveObjectPath() {
      return props.objectPath;
    }

    return {
      timeContext,
      timeMode,
      clock,
      timeSystemFormatter,
      isFixedTimeMode,
      isRealTimeMode,
      bounds,
      offsets
    };
  },
  data() {
    const timeOptions = this.domainObject.configuration.timeOptions ?? {
      clockOffsets: this.offsets,
      bounds: this.bounds
    };

    timeOptions.clock = timeOptions.clock ?? this.clock.key;
    timeOptions.mode = timeOptions.mode ?? this.timeMode;

    // check for older configurations that stored a key
    if (timeOptions.mode.key) {
      timeOptions.mode = timeOptions.mode.key;
    }

    return {
      independentTCEnabled: this.domainObject.configuration.useIndependentTime === true,
      timeOptions,
      viewBounds: {
        start: this.bounds.start,
        end: this.bounds.end
      }
    };
  },
  computed: {
    toggleTitle() {
      return `${this.independentTCEnabled ? 'Disable' : 'Enable'} Independent Time Conductor`;
    },
    showFixedInputs() {
      return this.isFixedTimeMode && this.independentTCEnabled;
    },
    showRealtimeInputs() {
      return this.isRealTimeMode && this.independentTCEnabled;
    }
  },
  watch: {
    domainObject: {
      handler(domainObject) {
        const key = this.openmct.objects.makeKeyString(domainObject.identifier);
        if (key !== this.keyString) {
          //domain object has changed
          console.log(`TODO: THIS SHOULD NEVER HAPPEN!!! `);
          this.destroyIndependentTime();

          // this.independentTCEnabled = domainObject.configuration.useIndependentTime === true;
          this.timeOptions = domainObject.configuration.timeOptions ?? {
            clockOffsets: this.openmct.time.getClockOffsets(),
            fixedOffsets: this.openmct.time.getBounds()
          };

          // these may not be set due to older configurations
          this.timeOptions.clock = this.timeOptions.clock ?? this.openmct.time.getClock().key;
          this.timeOptions.mode = this.timeOptions.mode ?? this.openmct.time.getMode();

          // check for older configurations that stored a key
          if (this.timeOptions.mode.key) {
            this.timeOptions.mode = this.timeOptions.mode.key;
          }

          this.initialize();
        }
      },
      deep: true
    },
    // objectPath: {
    //   handler(newPath, oldPath) {
    //     //domain object or view has probably changed
    //     this.setTimeContext();
    //   },
    //   deep: true
    // }
    clock(newClock) {
      this.setTimeOptionsClock(newClock);
    },
    timeMode(newTimeMode) {
      this.setTimeOptionsMode(newTimeMode);
    }
  },
  created() {
    this.initialize();
  },
  beforeUnmount() {
    this.destroyIndependentTime();
  },
  methods: {
    initialize() {
      this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      // this.setTimeContext();

      if (this.independentTCEnabled) {
        this.registerIndependentTimeOffsets();
      }
    },
    toggleIndependentTC() {
      this.independentTCEnabled = !this.independentTCEnabled;

      if (this.independentTCEnabled) {
        this.registerIndependentTimeOffsets();
      } else {
        this.clearPopup();
        this.destroyIndependentTime();
      }

      // TODO this is mutating a prop
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.useIndependentTime',
        this.independentTCEnabled
      );
    },
    setTimeOptionsClock(clock) {
      this.setTimeOptionsOffsets();
      this.timeOptions.clock = clock.key;
    },
    setTimeOptionsMode(mode) {
      this.setTimeOptionsOffsets();
      this.timeOptions.mode = mode;
    },
    setTimeOptionsOffsets() {
      this.timeOptions.clockOffsets = this.timeOptions.clockOffsets ?? this.offsets;
      this.timeOptions.fixedOffsets = this.timeOptions.fixedOffsets ?? this.bounds;
    },
    saveFixedBounds(bounds) {
      const newOptions = this.updateTimeOptionProperty({
        fixedOffsets: bounds
      });
      this.updateTimeOptions(newOptions);
    },
    saveClockOffsets(offsets) {
      const newOptions = this.updateTimeOptionProperty({
        clockOffsets: offsets
      });

      this.updateTimeOptions(newOptions);
    },
    saveMode(mode) {
      const newOptions = this.updateTimeOptionProperty({
        mode: mode
      });

      this.updateTimeOptions(newOptions);
    },
    saveClock(clock) {
      const newOptions = this.updateTimeOptionProperty({
        clock
      });

      this.updateTimeOptions(newOptions);
    },
    updateTimeOptions(options) {
      this.timeOptions = options;

      this.registerIndependentTimeOffsets();
      this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
    },
    registerIndependentTimeOffsets() {
      // const timeContext = this.openmct.time.getIndependentContext(this.keyString);
      let offsets;

      if (this.isFixedTimeMode) {
        offsets = this.timeOptions.fixedOffsets ?? this.bounds;
      } else {
        offsets = this.timeOptions.clockOffsets ?? this.offsets;
      }

      if (!this.timeContext.hasOwnContext()) {
        this.unregisterIndependentTime = this.openmct.time.addIndependentContext(
          this.keyString,
          offsets,
          this.isFixedTimeMode ? undefined : this.timeOptions.clock
        );
      } else {
        if (this.isRealTimeMode) {
          this.timeContext.setClock(this.timeOptions.clock);
        }

        this.timeContext.setMode(this.timeOptions.mode, offsets);
      }
    },
    destroyIndependentTime() {
      if (this.unregisterIndependentTime) {
        this.unregisterIndependentTime();
      }
    },
    updateTimeOptionProperty(option) {
      return Object.assign({}, this.timeOptions, option);
    }
  }
};
</script>
