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

import { ref } from 'vue';

/**
 * @typedef {Object} DragResizerOptions the options object
 * @property {number} [size=0] the initial size of the object to track size for
 * @property {Function} [callback] the function to call when drag is complete
 */

/**
 * @typedef {Object} ReturnObject the return object
 * @property {number} size the reactive size ref
 * @property {function} mousedown
 */

/**
 * Defines a drag resizer hook that tracks the size of an object
 * in vertical or horizontal direction on drag
 * @param {('horizontal'|'vertical')} [direction='horizontal'] the direction of drag to track
 * @param {DragResizerOptions} [param={}] the options object
 * @returns {ReturnObject}
 */
export function useDragResizer(direction = 'horizontal', { size: initialSize = 0, callback } = {}) {
  if (direction !== 'horizontal' && direction !== 'vertical') {
    throw new Error(`Must specify 'horizontal' or 'vertical' drag direction`);
  }

  const size = ref(initialSize);

  let dragStartLength;
  let dragStartPosition;
  const position = direction === 'horizontal' ? 'clientX' : 'clientY';

  /**
   * Begins the tracking process for the drag resizer
   * and attaches mousemove and mousedown listeners to track size after drag completion
   * Attach to a mousedown event for a draggable element
   * @param {*} event the mousedown event
   */
  function mousedown(event) {
    dragStartLength = size.value;
    dragStartPosition = event[position];

    document.addEventListener('mouseup', mouseup, {
      once: true,
      capture: true
    });
    document.addEventListener('mousemove', mousemove);
    event.preventDefault();
  }

  function mousemove(event) {
    const delta = event[position] - dragStartPosition;
    size.value = dragStartLength + delta;
  }

  function mouseup(event) {
    dragStartLength = undefined;
    dragStartPosition = undefined;

    document.removeEventListener('mousemove', mousemove);
    event.preventDefault();
    event.stopPropagation();

    callback?.();
  }

  return {
    size,
    mousedown
  };
}
