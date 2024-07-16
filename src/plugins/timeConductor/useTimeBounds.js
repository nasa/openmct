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

import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import throttle from '../../utils/throttle.js';

const THROTTLE_RATE = 300;

/**
 * Provides reactive `bounds`,
 * as well as a function to observe and update bounds changes,
 * which automatically stops observing when the component is unmounted.
 *
 * @param {OpenMCT} [openmct] the Open MCT API
 * @param {Array} objectPath The view's objectPath
 * @returns {{
 *   bounds: import('vue').Ref<object>,
 *   isTick: import('vue').Ref<boolean>
 * }}
 */
export function useTimeBounds(openmct, timeContext) {
  let stopObservingTimeBounds;

  const bounds = shallowRef(timeContext.value.getBounds());
  const isTick = ref(false);

  onBeforeUnmount(() => stopObservingTimeBounds?.());

  watch(
    timeContext,
    (newContext, oldContext) => {
      oldContext?.off(TIME_CONTEXT_EVENTS.boundsChanged, throttle(updateTimeBounds, THROTTLE_RATE));
      observeTimeBounds();
    },
    { immediate: true }
  );

  function observeTimeBounds() {
    timeContext.value.on(TIME_CONTEXT_EVENTS.boundsChanged, throttle(updateTimeBounds, THROTTLE_RATE));
    stopObservingTimeBounds = () =>
      timeContext.value.off(TIME_CONTEXT_EVENTS.boundsChanged, throttle(updateTimeBounds, THROTTLE_RATE));
  }

  function updateTimeBounds(_timeBounds, _isTick) {
    bounds.value = _timeBounds;
    isTick.value = _isTick;
  }

  return {
    isTick,
    bounds
  };
}
