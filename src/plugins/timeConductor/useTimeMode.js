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
 * Provides reactive `timeMode` which is reactive to a time context,
 * as well as a function to observe and update the component's time mode,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {OpenMCT} openmct the Open MCT API
 * @param {Array} objectPath The view's objectPath
 * @returns {{
 *   timeMode: import('vue').Ref<string>,
 *   isFixedTimeMode: import('vue').Ref<boolean>,
 *   isRealTimeMode: import('vue').Ref<boolean>
 * }}
 */
export function useTimeMode(openmct, timeContext) {
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
    stopObservingTimeMode = () => timeContext.value.off(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
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
    timeContext.value.setMode(_timeMode);
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
