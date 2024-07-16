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

import { computed, onBeforeUnmount, ref } from 'vue';

import {
  FIXED_MODE_KEY,
  REALTIME_MODE_KEY,
  TIME_CONTEXT_EVENTS
} from '../../api/time/constants.js';

/**
 * Provides reactive `isFixedTimeMode` and `isRealTimeMode`,
 * as well as a function to observe and update the component's time mode,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {OpenMCT} openmct the Open MCT API
 * @returns {{
 *   observeTimeMode: () => void,
 *   timeMode: import('vue').Ref<string>,
 *   isFixedTimeMode: import('vue').Ref<boolean>,
 *   isRealTimeMode: import('vue').Ref<boolean>
 * }}
 */
export function useTimeMode(openmct, options) {
  let stopObservingTimeMode;

  const timeMode = ref(openmct.time.getMode());
  const isFixedTimeMode = computed(() => timeMode.value === FIXED_MODE_KEY);
  const isRealTimeMode = computed(() => timeMode.value === REALTIME_MODE_KEY);

  onBeforeUnmount(() => stopObservingTimeMode?.());

  function observeTimeMode() {
    openmct.time.on(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
    stopObservingTimeMode = () => openmct.time.off(TIME_CONTEXT_EVENTS.modeChanged, updateTimeMode);
  }

  function updateTimeMode(_timeMode) {
    timeMode.value = _timeMode;
  }

  return {
    observeTimeMode,
    timeMode,
    isFixedTimeMode,
    isRealTimeMode
  };
}
