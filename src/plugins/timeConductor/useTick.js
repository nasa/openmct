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

import { throttle } from 'lodash';
import { onBeforeUnmount, ref, watch } from 'vue';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';

/**
 * @typedef {Number} currentValue current timestamp of time context clock
 */

/**
 * Provides reactive `currentValue` based on observed `tick` event,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {import('openmct').OpenMCT} openmct - The Open MCT API
 * @param {import('src/api/time/TimeContext.js').default} timeContext - the time context
 * @returns {{
 *   currentValue: import('vue').Ref<currentValue>
 * }}
 */
export function useTick(openmct, timeContext, throttleRate) {
  let stopObservingTick;

  const currentValue = ref(timeContext.value.now());

  const updateTick = throttleRate ? throttle(_updateTick, throttleRate) : _updateTick;
  onBeforeUnmount(() => stopObservingTick?.());

  watch(
    timeContext,
    (newContext, oldContext) => {
      oldContext?.off(TIME_CONTEXT_EVENTS.tick, updateTick);
      observeTick();
    },
    { immediate: true }
  );

  function observeTick() {
    timeContext.value.on(TIME_CONTEXT_EVENTS.tick, updateTick);
    stopObservingTick = () => timeContext.value.off(TIME_CONTEXT_EVENTS.tick, updateTick);
  }

  function _updateTick(timestamp) {
    currentValue.value = timestamp;
  }

  return {
    currentValue
  };
}
