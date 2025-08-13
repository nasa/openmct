import _ from 'lodash';
import { ref } from 'vue';

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
  let sizingContainers = 0;

  function addContainer(container) {
    containers.value.push(container);

    if (container.scale) {
      sizingContainers += container.scale;
    } else {
      sizingContainers++;
    }

    sizeItems(containers.value, container);

    callback?.();
  }

  function removeContainer(index) {
    containers.value.splice(index, 1);
    sizeToFill(containers.value);

    callback?.();
  }

  function reorderContainers(reorderPlan) {
    const oldContainers = containers.value.slice();

    reorderPlan.forEach((reorderEvent) => {
      containers.value[reorderEvent.newIndex] = oldContainers[reorderEvent.oldIndex];
    });

    callback?.();
  }

  function startContainerResizing(index) {
    const beforeContainer = containers.value[index];
    const afterContainer = containers.value[index + 1];

    maxMoveSize.value = beforeContainer.size + afterContainer.size;
  }

  function containerResizing(index, delta, event) {
    let percentageMoved = Math.round((delta / getElSize()) * 100);
    let beforeContainer = containers.value[index];
    let afterContainer = containers.value[index + 1];

    beforeContainer.size = getContainerSize(beforeContainer.size + percentageMoved);
    afterContainer.size = getContainerSize(afterContainer.size - percentageMoved);
  }

  function endContainerResizing() {
    callback?.();
  }

  function getElSize() {
    if (rowsLayout) {
      return element.value.offsetHeight;
    } else {
      return element.value.offsetWidth;
    }
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
   * Resize items so that newItem fits proportionally (newItem must be an element of items).
   * If newItem does not have a size or is sized at 100%,
   * newItem will have size set to (1 * newItemScale) / n * 100,
   * where n is the total number of items and newItemScale is the scale of newItem.
   * All other items will be resized to fit inside the remaining space.
   * @param {*} items
   * @param {*} newItem
   */
  function sizeItems(items, newItem) {
    const newItemScale = newItem.scale || 1;

    if (!newItem.size && items.length === 1) {
      newItem.size = 100;
    } else {
      if (!newItem.size || newItem.size === 100) {
        newItem.size = Math.round((100 * newItemScale) / sizingContainers);

        // Resize oldItems to fit inside remaining space;
        const oldItems = items.filter((item) => !_.isEqual(item, newItem));
        const remainingSize = 100 - newItem.size;

        oldItems.forEach((item) => {
          const itemScale = item.scale || 1;
          item.size = Math.round((item.size * itemScale * remainingSize) / 100);
        });

        // Ensure items add up to 100 in case of rounding error.
        const total = items.reduce((t, item) => t + item.size, 0);
        const excess = Math.round(100 - total);
        oldItems[oldItems.length - 1].size += excess;
      }
    }
  }

  /**
   * Scales items proportionally so total is equal to 100.
   * Assumes that an item was removed from array.
   * @param {*} items
   */
  function sizeToFill(items) {
    if (items.length === 0) {
      return;
    }

    const oldTotal = items.reduce((total, item) => total + item.size, 0);
    items.forEach((item) => {
      const itemScale = item.scale || 1;
      item.size = Math.round((item.size * itemScale * 100) / oldTotal);
    });

    // Ensure items add up to 100 in case of rounding error.
    const total = items.reduce((t, item) => t + item.size, 0);
    const excess = Math.round(100 - total);
    items[items.length - 1].size += excess;
  }

  return {
    addContainer,
    removeContainer,
    reorderContainers,
    containers,
    startContainerResizing,
    containerResizing,
    endContainerResizing
  };
}
