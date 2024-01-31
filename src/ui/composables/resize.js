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
import { onBeforeUnmount, reactive } from 'vue';

import throttle from '../../utils/throttle.js';
import { useEventListener } from './event.js';

/**
 * A composable which provides a function to begin observing the size of the passed-in element,
 * and a reactive object containing the width and height of the observed element. The ResizeObserver
 * is automatically disconnected before the component is unmounted.
 * @returns {{size: {width: number, height: number}, startObserving: (element: HTMLElement) => void}}
 */
export function useResizeObserver() {
  const size = reactive({ width: 0, height: 0 });
  let observer;

  const startObserving = (element) => {
    if (!element) {
      return;
    }

    observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        size.width = width;
        size.height = height;
      }
    });

    observer.observe(element);
  };

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return { size, startObserving };
}

/**
 * A composable function which can be used to listen to and handle window resize events.
 * Throttles the resize event to prevent performance issues.
 * @param {number} [throttleMs=100] The number of milliseconds to throttle the resize event.
 * @returns {Ref<{ width: number, height: number }>} windowSize
 */
export function useWindowResize(throttleMs = 100) {
  const windowSize = reactive({ width: window.innerWidth, height: window.innerHeight });

  const handleResize = throttle(() => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
  }, throttleMs);

  useEventListener(window, 'resize', handleResize);

  return { windowSize };
}
