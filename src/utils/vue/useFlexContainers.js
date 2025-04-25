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

import { computed, ref } from 'vue';

/**
 * @typedef {Object} configuration
 * @property {boolean} rowsLayout true if containers arranged as rows, false if columns
 * @property {number} minContainerSize minimum size in pixels of a container
 * @property {Function} callback function to call when container resize completes
 */

/**
 * Provides a means to size a collection of containers to a total size of 100%.
 * The containers will resize proportionally to fit the total size on add/remove.
 * The containers will initially be sized based on their scale property.
 * @param {import('vue').Ref<HTMLElement} element ref to the html total sizing element
 * @param {configuration} configuration object with configuration options
 * @returns
 */
export function useFlexContainers(
  element,
  { containers: existingContainers = [], rowsLayout, minContainerSize = 5, callback }
) {
  const containers = ref(existingContainers);
  const maxMoveSize = ref(null);

  const fixedContainersSize = computed(() => {
    return containers.value
      .filter((container) => container.fixed === true)
      .reduce((size, currentContainer) => size + currentContainer.size, 0);
  });

  function addContainer(container) {
    containers.value.push(container);

    sizeItems(containers.value);

    callback?.();
  }

  function removeContainer(index) {
    const isFlexContainer = !containers.value[index].fixed;

    containers.value.splice(index, 1);

    if (isFlexContainer) {
      sizeItems(containers.value);
    }

    callback?.();
  }

  function reorderContainers(reorderPlan) {
    const oldContainers = containers.value.slice();

    reorderPlan.forEach((reorderEvent) => {
      containers.value[reorderEvent.newIndex] = oldContainers[reorderEvent.oldIndex];
    });

    callback?.();
  }

  function setContainers(_containers) {
    containers.value = _containers;
    sizeItems(containers.value);
  }

  function startContainerResizing(index) {
    const beforeContainer = getBeforeContainer(index);
    const afterContainer = getAfterContainer(index);

    maxMoveSize.value = beforeContainer.size + afterContainer.size;
  }

  function getBeforeContainer(index) {
    return containers.value
      .slice(0, index + 1)
      .filter((container) => !container.fixed === true)
      .at(-1);
  }

  function getAfterContainer(index) {
    return containers.value.slice(index + 1).filter((container) => !container.fixed === true)[0];
  }

  function containerResizing(index, delta, event) {
    const beforeContainer = getBeforeContainer(index);
    const afterContainer = getAfterContainer(index);
    const percentageMoved = Math.round((delta / getElSize()) * 100);

    if (beforeContainer === undefined || afterContainer === undefined) {
      console.warn(
        'Cannot drag to resize a single flex sized containers. Use Elements Tab in Inspector to resize fixed containers.'
      );

      return;
    }

    if (beforeContainer.fixed === true && afterContainer.fixed === true) {
      console.warn(
        'Cannot drag to resize two fixed sized containers. Use Elements Tab in Inspector to resize.'
      );

      return;
    }

    beforeContainer.size = getContainerSize(beforeContainer.size + percentageMoved);
    afterContainer.size = getContainerSize(afterContainer.size - percentageMoved);
  }

  function endContainerResizing() {
    callback?.();
  }

  function getElSize() {
    const elSize = rowsLayout === true ? element.value.offsetHeight : element.value.offsetWidth;

    return elSize - fixedContainersSize.value;
  }

  function getContainerSize(size) {
    if (size < minContainerSize) {
      return minContainerSize;
    } else if (size > maxMoveSize.value - minContainerSize) {
      return maxMoveSize.value - minContainerSize;
    } else {
      return size;
    }
  }

  /**
   * Resize flexible sized items so they fit proportionally within a viewport
   * 1. add size to 0 sized items based on scale proportional to total scale
   * 2. resize item sizes to equal 100
   * if total size < 100, resize all items
   * if total size > 100, resize only items not resized in step 1 (newly added)
   * 3. round excess and apply to last item
   *
   * Items may have a scale (ie. items with composition)
   *
   * Handles single add or removal, as well as atypical use cases,
   * such as composition out of sync with containers config
   * due to composition edits outside of view
   *
   * @param {*} items
   */
  function sizeItems(items) {
    let totalSize;
    const itemsWithSize = items.filter((item) => item.size);
    const itemsWithoutSize = items.filter((item) => !item.size);
    // total number of items, adjusted by each item scale
    const totalScale = items.reduce((total, item) => {
      const scale = item.scale ?? 1;
      return total + scale;
    }, 0);

    itemsWithoutSize.forEach((item) => {
      const scale = item.scale ?? 1;
      item.size = Math.round((100 * scale) / totalScale);
    });

    totalSize = items.reduce((total, item) => total + item.size, 0);

    if (totalSize > 100) {
      const addedSize = itemsWithoutSize.reduce((total, item) => total + item.size, 0);
      const remainingSize = 100 - addedSize;

      itemsWithSize.forEach((item) => {
        const scale = item.scale ?? 1;
        item.size = Math.round((item.size * scale * remainingSize) / 100);
      });
    } else if (totalSize < 100) {
      const sizeToFill = 100 - totalSize;

      items.forEach((item) => {
        const scale = item.scale ?? 1;
        item.size = Math.round((item.size * scale * 100) / sizeToFill);
      });
    }

    // Ensure items add up to 100 in case of rounding error.
    totalSize = items.reduce((total, item) => total + item.size, 0);
    const excess = Math.round(100 - totalSize);
    items[items.length - 1].size += excess;
  }

  return {
    addContainer,
    removeContainer,
    reorderContainers,
    setContainers,
    containers,
    startContainerResizing,
    containerResizing,
    endContainerResizing
  };
}
