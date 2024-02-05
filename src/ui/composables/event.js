/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/* eslint-disable func-style */

import { isRef, onBeforeMount, onBeforeUnmount, onMounted, watch } from 'vue';

/**
 * Registers an event listener on the specified target and automatically removes it when the
 * component is unmounted.
 * This is a Vue composition API utility function.
 * @param {EventTarget} target - The target to attach the event listener to.
 * @param {string} event - The name of the event to listen for.
 * @param {Function} handler - The callback function to execute when the event is triggered.
 */
export function useEventListener(target, event, handler) {
  const addListener = (el) => {
    if (el) {
      el.addEventListener(event, handler);
    }
  };

  const removeListener = (el) => {
    if (el) {
      el.removeEventListener(event, handler);
    }
  };

  // If target is a reactive ref, watch it for changes
  if (isRef(target)) {
    watch(
      target,
      (newTarget, oldTarget) => {
        if (newTarget !== oldTarget) {
          removeListener(oldTarget);
          addListener(newTarget);
        }
      },
      { immediate: true }
    );
  } else {
    // Otherwise use lifecycle hooks to add/remove listener
    onMounted(() => addListener(target));
    onBeforeUnmount(() => removeListener(target));
  }
}

/**
 * Registers an event listener on the specified EventEmitter instance and automatically removes it
 * when the component is unmounted.
 * This is a Vue composition API utility function.
 * @param {import('eventemitter3').EventEmitter} emitter - The EventEmitter instance to attach the event listener to.
 * @param {string} event - The name of the event to listen for.
 * @param {Function} callback - The callback function to execute when the event is triggered.
 */
export function useEventEmitter(emitter, event, callback) {
  onBeforeMount(() => emitter.on(event, callback));
  onBeforeUnmount(() => emitter.off(event, callback));
}
