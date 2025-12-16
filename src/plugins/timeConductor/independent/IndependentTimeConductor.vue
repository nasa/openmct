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
      ref="conductorPopupComponent"
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
import { computed, inject, onBeforeMount, onBeforeUnmount, provide, ref, watch } from 'vue';

import ConductorModeIcon from '@/plugins/timeConductor/ConductorModeIcon.vue';

import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import ConductorInputsFixed from '../ConductorInputsFixed.vue';
import ConductorInputsRealtime from '../ConductorInputsRealtime.vue';
import ConductorPopUp from '../ConductorPopUp.vue';
import { useTime } from '../useTime.js';
import { useIndependentTimeConductorPopUp } from './useIndependentTimeConductorPopUp.js';

export default {
  components: {
    ConductorModeIcon,
    ConductorInputsRealtime,
    ConductorInputsFixed,
    ConductorPopUp,
    ToggleSwitch
  },
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
    let unregisterIndependentTimeContext;
    const timeConductorOptionsHolder = ref(null);
    const conductorPopupComponent = ref(null);
    const openmct = inject('openmct');
    const configuration = openmct.layout?.conductorComponent?.provide?.configuration;

    const keyString = ref(openmct.objects.makeKeyString(props.domainObject.identifier));
    const independentTCEnabled = ref(props.domainObject.configuration?.useIndependentTime === true);
    const timeOptions = ref(props.domainObject.configuration?.timeOptions);

    const {
      timeContext,
      timeSystemKey,
      timeSystemFormatter,
      timeSystemDurationFormatter,
      isTimeSystemUTCBased,
      timeMode,
      isFixedTimeMode,
      isRealTimeMode,
      getAllModeMetadata,
      getModeMetadata,
      currentValue,
      bounds,
      isTick,
      offsets,
      clock,
      getAllClockMetadata,
      getClockMetadata
    } = useTime(openmct, () => props.objectPath, configuration, timeOptions, independentTCEnabled);

    const { positionX, positionY, showConductorPopup, initializePopup, clearPopup } =
      useIndependentTimeConductorPopUp(
        conductorPopupComponent,
        timeConductorOptionsHolder,
        independentTCEnabled
      );

    const toggleTitle = computed(() => {
      return `${independentTCEnabled.value ? 'Disable' : 'Enable'} Independent Time Conductor`;
    });
    const showFixedInputs = computed(() => {
      return isFixedTimeMode.value && independentTCEnabled.value;
    });
    const showRealtimeInputs = computed(() => {
      return isRealTimeMode.value && independentTCEnabled.value;
    });

    function initialize() {
      timeOptions.value = props.domainObject.configuration?.timeOptions;
      if (independentTCEnabled.value) {
        registerIndependentTimeContext();
      }
    }

    function handleIndependentTimeConductorChange() {
      if (independentTCEnabled.value) {
        registerIndependentTimeContext();
      } else {
        clearPopup();
        unregisterIndependentTimeContext?.();
        unregisterIndependentTimeContext = null;
      }
    }

    function registerIndependentTimeContext() {
      let shouldUpdateTimeOptions = false;

      if (timeOptions.value === undefined) {
        timeOptions.value = {};
        shouldUpdateTimeOptions = true;
      }

      if (timeOptions.value.fixedOffsets === undefined) {
        timeOptions.value.fixedOffsets = bounds.value;
        shouldUpdateTimeOptions = true;
      }

      if (timeOptions.value.clockOffsets === undefined) {
        timeOptions.value.clockOffsets = offsets.value;
        shouldUpdateTimeOptions = true;
      }

      if (timeOptions.value.mode === undefined) {
        timeOptions.value.mode = timeMode.value;
        shouldUpdateTimeOptions = true;

        // check for older configurations that stored a key
        if (timeOptions.value.mode.key) {
          timeOptions.value.mode = timeOptions.value.mode.key;
        }
      }

      if (timeOptions.value.clock === undefined && timeOptions.value.mode === 'realtime') {
        timeOptions.value.clock = clock.value.key;
        shouldUpdateTimeOptions = true;
      }

      if (timeOptions.value.clock !== undefined && timeOptions.value.mode === 'fixed') {
        timeOptions.value.clock = undefined;
        shouldUpdateTimeOptions = true;
      }

      if (shouldUpdateTimeOptions) {
        updateTimeOptions();
      }

      const _isFixedTimeMode = timeOptions.value.mode === 'fixed';
      const independentTimeContextBoundsOrOffsets = _isFixedTimeMode
        ? timeOptions.value.fixedOffsets
        : timeOptions.value.clockOffsets;

      const independentTimeContext = openmct.time.getIndependentContext(keyString.value);

      if (!independentTimeContext.hasOwnContext()) {
        unregisterIndependentTimeContext = openmct.time.addIndependentContext(
          keyString.value,
          independentTimeContextBoundsOrOffsets,
          timeOptions.value.clock
        );
      } else {
        if (!_isFixedTimeMode) {
          independentTimeContext.setClock(timeOptions.value.clock);
        }
        independentTimeContext.setMode(
          timeOptions.value.mode,
          independentTimeContextBoundsOrOffsets
        );
      }
    }

    function toggleIndependentTC() {
      independentTCEnabled.value = !independentTCEnabled.value;

      openmct.objects.mutate(
        props.domainObject,
        'configuration.useIndependentTime',
        independentTCEnabled.value
      );
    }

    function saveFixedBounds() {
      timeOptions.value.fixedOffsets = bounds.value;
      updateTimeOptions();
    }

    function saveClockOffsets() {
      timeOptions.value.clockOffsets = offsets.value;
      updateTimeOptions();
    }

    function saveMode() {
      timeOptions.value.mode = timeMode.value;
      updateTimeOptions();
    }

    function saveClock() {
      timeOptions.value.clock = clock.value.key;
      updateTimeOptions();
    }

    function updateTimeOptions() {
      openmct.objects.mutate(props.domainObject, 'configuration.timeOptions', timeOptions.value);
    }

    onBeforeMount(() => {
      initialize();
    });

    onBeforeUnmount(() => {
      unregisterIndependentTimeContext?.();
      unregisterIndependentTimeContext = null;
    });

    watch(independentTCEnabled, () => {
      handleIndependentTimeConductorChange();
    });

    watch(timeContext, () => {
      const _keyString = openmct.objects.makeKeyString(props.domainObject.identifier);

      if (_keyString !== keyString.value) {
        // domain object in object view has changed (via tree navigation)
        unregisterIndependentTimeContext?.();
        unregisterIndependentTimeContext = null;
        keyString.value = _keyString;
        independentTCEnabled.value = props.domainObject.configuration.useIndependentTime === true;

        initialize();
      }
    });

    watch(clock, () => {
      if (independentTCEnabled.value) {
        saveClock();
      }
    });

    watch(timeMode, () => {
      if (independentTCEnabled.value && timeMode.value) {
        saveMode();
      }
    });

    watch(offsets, () => {
      if (independentTCEnabled.value) {
        saveClockOffsets();
      }
    });

    watch(bounds, () => {
      if (independentTCEnabled.value && isTick.value === false && isFixedTimeMode.value === true) {
        saveFixedBounds();
      }
    });

    provide('timeContext', timeContext);
    provide('timeSystemKey', timeSystemKey);
    provide('timeSystemFormatter', timeSystemFormatter);
    provide('timeSystemDurationFormatter', timeSystemDurationFormatter);
    provide('isTimeSystemUTCBased', isTimeSystemUTCBased);
    provide('timeMode', timeMode);
    provide('isFixedTimeMode', isFixedTimeMode);
    provide('isRealTimeMode', isRealTimeMode);
    provide('getAllModeMetadata', getAllModeMetadata);
    provide('getModeMetadata', getModeMetadata);
    provide('currentValue', currentValue);
    provide('bounds', bounds);
    provide('isTick', isTick);
    provide('offsets', offsets);
    provide('clock', clock);
    provide('getAllClockMetadata', getAllClockMetadata);
    provide('getClockMetadata', getClockMetadata);

    return {
      toggleTitle,
      toggleIndependentTC,
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
      offsets,
      timeConductorOptionsHolder,
      conductorPopupComponent,
      positionX,
      positionY,
      showConductorPopup,
      initializePopup,
      clearPopup
    };
  }
};
</script>
