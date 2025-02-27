import { ref } from 'vue';

export function useFlexContainers(element, { rowsLayout, minContainerSize = 5, callback }) {
  const containers = ref([]);
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
    // persist the new container sizes
    callback?.(containers.value);
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

  // Resize items so that newItem fits proportionally (newItem must be an element
  // of items).  If newItem does not have a size or is sized at 100%, newItem will
  // have size set to 1/n * 100, where n is the total number of items.
  function sizeItems(items, newItem) {
    const newItemScale = newItem.scale || 1;

    if (items.length === 1) {
      newItem.size = 100;
    } else {
      if (!newItem.size || newItem.size === 100) {
        newItem.size = Math.round((100 * newItemScale) / sizingContainers);
      }

      // Resize oldItems to fit inside remaining space;
      const oldItems = items.filter((item) => item !== newItem);
      const remainingSize = 100 - newItem.size;

      oldItems.forEach((item) => {
        const itemScale = item.scale || 1;
        item.size = Math.round((item.size * itemScale * remainingSize) / 100);
      });

      // Ensure items add up to 100 in case of rounding error.
      let total = items.reduce((t, item) => t + item.size, 0);
      let excess = Math.round(100 - total);
      oldItems[oldItems.length - 1].size += excess;
    }
  }

  return {
    addContainer,
    containers,
    startContainerResizing,
    containerResizing,
    endContainerResizing
  };
}
