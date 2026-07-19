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
 * @property {number} [initialX=0] the initial x of the object to track size for
 * @property {number} [initialY=0] the initial y of the object to track size for
 * @property {Function} [callback] the function to call when drag is complete
 */

/**
 * @typedef {Object} ReturnObject the return object
 * @property {number} x the reactive horizontal size during/post drag
 * @property {number} y the reactive vertical size during/post drag
 * @property {function} mousedown
 */

/**
 * Defines a drag resizer hook that tracks the size of an object
 * in vertical and horizontal direction on drag
 * @param {DragResizerOptions} [param={}] the options object
 * @returns {ReturnObject}
 */
export function useDragResizer({ initialX = 0, initialY = 0, callback } = {}) {
  const x = ref(initialX);
  const y = ref(initialY);
  const isDragging = ref(false);

  let dragStartX;
  let dragStartY;
  let dragStartClientX;
  let dragStartClientY;

  /**
   * Begins the tracking process for the drag resizer
   * and attaches mousemove and mousedown listeners to track size after drag completion
   * Attach to a mousedown event for a draggable element
   * @param {*} event the mousedown event
   */
  function mousedown(event) {
    dragStartX = x.value;
    dragStartY = y.value;
    dragStartClientX = event.clientX;
    dragStartClientY = event.clientY;
    isDragging.value = true;

    document.addEventListener('mouseup', mouseup, {
      once: true,
      capture: true
    });
    document.addEventListener('mousemove', mousemove);
    event.preventDefault();
  }

  function mousemove(event) {
    const deltaX = event.clientX - dragStartClientX;
    const deltaY = event.clientY - dragStartClientY;

    x.value = dragStartX + deltaX;
    y.value = dragStartY + deltaY;
  }

  function mouseup(event) {
    dragStartX = undefined;
    dragStartY = undefined;
    dragStartClientX = undefined;
    dragStartClientY = undefined;
    isDragging.value = false;

    document.removeEventListener('mousemove', mousemove);
    event.preventDefault();
    event.stopPropagation();

    callback?.();
  }

  return {
    mousedown,
    x,
    y,
    isDragging
  };
}
