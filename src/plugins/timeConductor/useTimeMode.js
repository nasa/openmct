/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import {
  FIXED_MODE_KEY,
  REALTIME_MODE_KEY,
  TIME_CONTEXT_EVENTS
} from '../../api/time/constants.js';

/**
 * @typedef {import('src/api/time/TimeContext.js').Mode} Mode
 */

/**
 * Provides reactive `timeMode` which is reactive to a time context,
 * as well as a function to observe and update the component's time mode,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {import('openmct').OpenMCT} openmct - The Open MCT API
 * @param {import('src/api/time/TimeContext.js').default} timeContext - The time context
 * @param {import('vue').Ref<Object>} independentTimeOptions - time options for independent time conductor
 * @param {import('vue').Ref<boolean>} useIndependentTime - Whether to follow independent time conductor
 * @returns {{
 *   timeMode: import('vue').Ref<Mode>,
 *   getAllModeMetadata: import('vue').Ref<() => void>,
 *   getModeMetadata: import('vue').Ref<() => void>,
 *   isFixedTimeMode: import('vue').Ref<boolean>,
 *   isRealTimeMode: import('vue').Ref<boolean>
 * }}
 */
export function useTimeMode(openmct, timeContext, independentTimeOptions, useIndependentTime) {
  let stopObservingTimeMode;

  const timeMode = ref(timeContext.value.getMode());
  const isFixedTimeMode = computed(() => timeMode.value === FIXED_MODE_KEY);
  const isRealTimeMode = computed(() => timeMode.value === REALTIME_MODE_KEY);

  onBeforeUnmount(() => stopObservingTimeMode?.());

  watch(
    timeContext,
    (newContext, oldContext) => {
      oldContext?.off(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
      observeTimeMode();
    },
    { immediate: true }
  );

  function observeTimeMode() {
    timeContext.value.on(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
    stopObservingTimeMode = () =>
      timeContext.value.off(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
  }

  function getAllModeMetadata() {
    return [FIXED_MODE_KEY, REALTIME_MODE_KEY].map(getModeMetadata);
  }

  function getModeMetadata(key) {
    const fixedModeMetadata = {
      key: FIXED_MODE_KEY,
      name: 'Fixed Timespan',
      description: 'Query and explore data that falls between two fixed datetimes.',
      cssClass: 'icon-tabular',
      onItemClicked: () => setTimeMode(key)
    };

    const realTimeModeMetadata = {
      key: REALTIME_MODE_KEY,
      name: 'Real-Time',
      description:
        'Monitor streaming data in real-time. The Time Conductor and displays will automatically advance themselves based on the active clock.',
      cssClass: 'icon-clock',
      onItemClicked: () => setTimeMode(key)
    };

    return key === FIXED_MODE_KEY ? fixedModeMetadata : realTimeModeMetadata;
  }

  function setTimeMode(_timeMode) {
    if (useIndependentTime.value) {
      const boundsOrOffsets =
        _timeMode === FIXED_MODE_KEY
          ? independentTimeOptions.value.fixedOffsets
          : independentTimeOptions.value.clockOffsets;
      timeContext.value.setMode(_timeMode, boundsOrOffsets);
    } else {
      timeContext.value.setMode(_timeMode);
    }
  }

  function updateTimeMode(_timeMode) {
    timeMode.value = _timeMode;
  }

  return {
    timeMode,
    getAllModeMetadata,
    getModeMetadata,
    isFixedTimeMode,
    isRealTimeMode
  };
}
