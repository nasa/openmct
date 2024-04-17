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

import { onBeforeUnmount, ref } from 'vue';

const DEFAULT_DURATION_FORMATTER = 'duration';

/**
 * Provides a reactive destructuring of the component's current time system,
 * as well as a function to observe and update the component's time system,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {OpenMCT} openmct the Open MCT API
 * @returns {{
 *   observeTimeSystem: () => void,
 *   timeSystemKey: import('vue').Ref<string>,
 *   timeSystemFormatter: import('vue').Ref<() => void>,
 *   timeSystemDurationFormatter: import('vue').Ref<() => void>,
 *   isTimeSystemUTCBased: import('vue').Ref<boolean>
 * }}
 */
export function useTimeSystem(openmct, options) {
  let stopObservingTimeSystem;

  const currentTimeSystem = openmct.time.getTimeSystem();

  const timeSystemKey = ref(currentTimeSystem.key);
  const timeSystemFormatter = ref(getFormatter(openmct, currentTimeSystem.timeFormat));
  const timeSystemDurationFormatter = ref(
    getFormatter(openmct, currentTimeSystem.durationFormat || DEFAULT_DURATION_FORMATTER)
  );
  const isTimeSystemUTCBased = ref(currentTimeSystem.isUTCBased);

  onBeforeUnmount(() => stopObservingTimeSystem?.());

  function observeTimeSystem() {
    openmct.time.on('timeSystemChanged', updateTimeSystem);
    stopObservingTimeSystem = () => openmct.time.off('timeSystemChanged', updateTimeSystem);
  }

  function updateTimeSystem(timeSystem) {
    timeSystemKey.value = timeSystem.key;
    timeSystemFormatter.value = getFormatter(openmct, timeSystem.timeFormat);
    timeSystemDurationFormatter.value = getFormatter(
      openmct,
      timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );
    isTimeSystemUTCBased.value = timeSystem.isUTCBased;
  }

  return {
    observeTimeSystem,
    timeSystemKey,
    timeSystemFormatter,
    timeSystemDurationFormatter,
    isTimeSystemUTCBased
  };
}

function getFormatter(openmct, key) {
  return openmct.telemetry.getValueFormatter({
    format: key
  }).formatter;
}
