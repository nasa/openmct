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

/**
 * @typedef {Boolean} isOverflowing whether the element is overflowing (scrollWidth > clientWidth)
 * @typedef {Function} observeOverflow observe the element of a child component for overflow
 * @typedef {Function} unObserveOverflow unobserve the element of a child component for overflow
 */

import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * Observes the overflow of a child component
 * @param {import('vue').Component} component the parent component
 * @param {string} childRef the ref name of the child component
 * @returns { isOverflowing, observeOverflow, unObserveOverflow }
 */
export function useOverflowObserver(component, childRef) {
  let observer;
  let element;

  const width = ref(null);
  const scrollWidth = ref(null);
  const isOverflowing = computed(() => scrollWidth.value > width.value);

  onMounted(() => {
    observer = new ResizeObserver((entries) => {
      width.value = entries[0].target.clientWidth;
      scrollWidth.value = entries[0].target.scrollWidth;
    });

    element = component.value.$refs[childRef];
  });

  onUnmounted(() => {
    observer.disconnect();
  });

  function observeOverflow() {
    observer.observe(element);
  }

  function unObserveOverflow() {
    width.value = null;
    scrollWidth.value = null;
    observer.unobserve(element);
  }

  return {
    isOverflowing,
    observeOverflow,
    unObserveOverflow
  };
}
