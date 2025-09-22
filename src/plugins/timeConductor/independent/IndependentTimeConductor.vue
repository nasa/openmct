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
      isFixedTimeMode
        ? 'is-fixed-mode'
        : independentTCEnabled
          ? 'is-realtime-mode'
          : 'is-fixed-mode',
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
import { computed, inject, provide, ref, toRaw } from 'vue';

import ConductorModeIcon from '@/plugins/timeConductor/ConductorModeIcon.vue';

import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import ConductorInputsFixed from '../ConductorInputsFixed.vue';
import ConductorInputsRealtime from '../ConductorInputsRealtime.vue';
import ConductorPopUp from '../ConductorPopUp.vue';
import { useTime } from '../useTime.js';
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

    const keyString = ref(openmct.objects.makeKeyString(props.domainObject.identifier));
    const independentTCEnabled = ref(props.domainObject.configuration?.useIndependentTime === true);

    const {
      timeContext,
      timeSystemFormatter,
      timeSystemDurationFormatter,
      isTimeSystemUTCBased,
      timeMode,
      isFixedTimeMode,
      isRealTimeMode,
      getAllModeMetadata,
      getModeMetadata,
      bounds,
      isTick,
      offsets,
      clock,
      getAllClockMetadata,
      getClockMetadata
    } = useTime(openmct, () => props.objectPath);

    const toggleTitle = computed(() => {
      return `${independentTCEnabled.value ? 'Disable' : 'Enable'} Independent Time Conductor`;
    });
    const showFixedInputs = computed(() => {
      return isFixedTimeMode.value && independentTCEnabled.value;
    });
    const showRealtimeInputs = computed(() => {
      return isRealTimeMode.value && independentTCEnabled.value;
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

    return {
      toggleTitle,
      showFixedInputs,
      showRealtimeInputs,
      keyString,
      independentTCEnabled,
      openmct,
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
  watch: {
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
    clock() {
      if (this.independentTCEnabled) {
        this.saveClock();
      }
    },
    timeMode() {
      console.log('timeMode changed', this.timeMode);
      if (this.independentTCEnabled && this.timeMode) {
        console.log('saving mode');
        this.saveMode();
      }
    },
    offsets() {
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
        this.timeOptions.clock = this.clock?.key ?? this.timeContext.getClock().key;
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
      // this.registerIndependentTimeContext();
      this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
    },
    registerIndependentTimeContext() {
      const bounds = this.timeOptions.fixedOffsets ?? this.bounds;
      const offsets = this.timeOptions.clockOffsets ?? this.offsets;
      const clockKey = this.timeOptions.clock || this.clock.key;

      const independentTimeContextBoundsOrOffsets = this.isFixedTimeMode ? bounds : offsets;
      const independentTimeContextClockKey = this.isFixedTimeMode ? undefined : clockKey;

      const independentTimeContext = this.openmct.time.getIndependentContext(this.keyString);

      console.log(independentTimeContext.hasOwnContext());
      if (!independentTimeContext.hasOwnContext()) {
        this.unregisterIndependentTimeContext = this.openmct.time.addIndependentContext(
          this.keyString,
          independentTimeContextBoundsOrOffsets,
          independentTimeContextClockKey
        );
      } else {
        if (this.isRealTimeMode) {
          independentTimeContext.setClock(this.timeOptions.clock);
        }
        independentTimeContext.setMode(
          this.timeOptions.mode,
          independentTimeContextBoundsOrOffsets
        );
      }
    }
  }
};
</script>
