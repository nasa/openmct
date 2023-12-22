import { onBeforeMount, onBeforeUnmount } from 'vue';

/**
 * @param {*} api the specific openmct API to use i.e. openmct.editor
 * @param {string} eventName
 * @param {() => void} handler
 */
export function useEventListener(api, eventName, handler) {
  onBeforeMount(() => {
    // Add the event listener before the component is mounted
    api.on(eventName, handler);
  });

  onBeforeUnmount(() => {
    // Remove the event listener before the component is unmounted
    api.off(eventName, handler);
  });
}
