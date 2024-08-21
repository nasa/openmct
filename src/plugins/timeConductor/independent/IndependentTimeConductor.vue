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
      :read-only="true"
      :compact="true"
    />

    <ConductorInputsRealtime
      v-if="showRealtimeInputs"
      class="c-compact-tc__bounds--real-time"
      :read-only="true"
      :compact="true"
    />

    <ConductorPopUp
      v-if="showConductorPopup"
      ref="conductorPopup"
      :is-independent="true"
      :bottom="true"
      :position-x="positionX"
      :position-y="positionY"
      @popup-loaded="initializePopup"
      @dismiss="clearPopup"
    />
  </div>
</template>

<script>
import { inject, provide, toRaw } from 'vue';

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
    const { timeContext } = useTimeContext(openmct, () => props.objectPath);

    const { timeSystemFormatter, timeSystemDurationFormatter, isTimeSystemUTCBased } =
      useTimeSystem(openmct, timeContext);
    const { timeMode, isFixedTimeMode, isRealTimeMode, getAllModeMetadata, getModeMetadata } =
      useTimeMode(openmct, timeContext);
    const { bounds, isTick } = useTimeBounds(openmct, timeContext);
    const { clock, getAllClockMetadata, getClockMetadata } = useClock(openmct, timeContext);
    const { offsets } = useClockOffsets(openmct, timeContext);

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

    return {
      timeContext,
      timeMode,
      clock,
      timeSystemFormatter,
      isFixedTimeMode,
      isRealTimeMode,
      bounds,
      isTick,
      offsets
    };
  },
  data() {
    return {
      keyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
      independentTCEnabled: this.domainObject.configuration.useIndependentTime === true
    };
  },
  computed: {
    myKeyString() {
      const identifier = this.domainObject.identifier;
      return this.openmct.objects.makeKeyString(identifier);
    },
    do() {
      console.log(this.objectPath[0]);
      return this.objectPath[0];
    },
    // itcEnabled() {
    //   console.log(`itcEnabled: ${this.domainObject.configuration.useIndependentTime === true}`);
    //   return this.domainObject.configuration.useIndependentTime === true;
    // },
    configuration() {
      console.log('why does this not fire when watch domainObject fires?');
      return this.domainObject.configuration && {};
    },
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
    myKeyString() {
      console.log(`object changed`);
    },
    independentTCEnabled() {
      this.handleIndependentTimeConductorChange();
    },
    timeContext() {
      const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      if (keyString !== this.keyString) {
        //domain object in object view has changed (via tree navigation)
        this.unregisterIndependentTimeContext?.();
        this.keyString = keyString;

        this.independentTCEnabled = this.domainObject.configuration.useIndependentTime === true;

        this.setTimeOptions();

        this.initialize();
      }
    },
    independentTCEnabled() {
      this.handleIndependentTimeConductorChange();
    },
    clock() {
      if (this.independentTCEnabled) {
        this.saveClock();
      }
    },
    timeMode() {
      if (this.independentTCEnabled) {
        this.saveMode();
      }
    },
    clockOffsets() {
      if (this.independentTCEnabled) {
        this.saveClockOffsets();
      }
    },
    bounds() {
      if (this.independentTCEnabled && this.isTick === false) {
        this.saveFixedBounds();
      }
    }
  },
  created() {
    // this.initialize();
  },
  mounted() {
    this.setTimeOptions();

    this.initialize();
  },
  beforeUnmount() {
    this.unregisterIndependentTimeContext?.();
  },
  methods: {
    initialize() {
      if (this.independentTCEnabled) {
        this.registerIndependentTimeContext();
      }
    },
    handleIndependentTimeConductorChange() {
      if (this.independentTCEnabled) {
        this.registerIndependentTimeContext();
      } else {
        this.clearPopup();
        this.unregisterIndependentTimeContext?.();
      }
    },
    toggleIndependentTC() {
      this.independentTCEnabled = !this.independentTCEnabled;

      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.useIndependentTime',
        this.independentTCEnabled
      );

    },
    setTimeOptions() {
      this.timeOptions = toRaw(this.domainObject.configuration.timeOptions);
      if (!this.timeOptions) {
        this.timeOptions = {
          clockOffsets: this.offsets,
          fixedOffsets: this.bounds
        };
      }

      if (!this.timeOptions.clock) {
        // can remove openmct.time.getClock() if timeContexts have clock in fixed time
        this.timeOptions.clock = this.clock?.key ?? this.openmct.time.getClock().key;
      }

      if (!this.timeOptions.mode) {
        this.timeOptions.mode = this.timeMode;
      }

      // check for older configurations that stored a key
      if (this.timeOptions.mode.key) {
        this.timeOptions.mode = this.timeOptions.mode.key;
      }
    },
    saveFixedBounds() {
      this.timeOptions.fixedOffsets = this.bounds;
      this.updateTimeOptions();
    },
    saveClockOffsets() {
      this.timeOptions.clockOffsets = this.offsets;
      this.updateTimeOptions();
    },
    saveMode() {
      this.timeOptions.mode = this.timeMode;
      this.updateTimeOptions();
    },
    saveClock() {
      this.timeOptions.clock = this.clock?.key;
      this.updateTimeOptions();
    },
    updateTimeOptions() {
      this.registerIndependentTimeContext();
      this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
    },
    registerIndependentTimeContext() {
      const bounds = this.timeOptions.fixedOffsets ?? this.bounds;
      const offsets = this.timeOptions.clockOffsets ?? this.offsets;
      const clockKey = this.timeOptions.clock || this.clock.key;

      const independentTimeContextBoundsOrOffsets = this.isFixedTimeMode ? bounds : offsets;
      const independentTimeContextClockKey = this.isFixedTimeMode ? undefined : clockKey;

      const independentTimeContext = this.openmct.time.getIndependentContext(this.keyString);

      if (!independentTimeContext.hasOwnContext()) {
        this.unregisterIndependentTimeContext = this.openmct.time.addIndependentContext(
          this.keyString,
          independentTimeContextBoundsOrOffsets,
          independentTimeContextClockKey
        );
      } else {
        // if (this.isRealTimeMode) {
        //   independentTimeContext.setClock(this.timeOptions.clock);
        // }

        // independentTimeContext.setMode(this.timeOptions.mode, independentTimeContextBoundsOrOffsets);
      }
    },
    registerIndependentTimeOffsets() {
      // const timeContext = this.openmct.time.getIndependentContext(this.keyString);
      const clockKey = this.timeOptions.clock || this.clock.key;
      let offsets;

      if (this.isFixedTimeMode) {
        offsets = this.timeOptions.fixedOffsets ?? this.bounds;
      } else {
        offsets = this.timeOptions.clockOffsets ?? this.offsets;
      }

      if (!this.timeContext.hasOwnContext()) {
        this.unregisterIndependentTimeContext = this.openmct.time.addIndependentContext(
          this.keyString,
          offsets,
          this.isFixedTimeMode ? undefined : clockKey
        );
      } else {
        console.log('removed code');
        // if (this.isRealTimeMode) {
        //   this.timeContext.setClock(this.timeOptions.clock);
        // }

        // this.timeContext.setMode(this.timeOptions.mode, offsets);
      }
    }
  }
};
</script>
