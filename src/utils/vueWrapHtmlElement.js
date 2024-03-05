import { defineComponent, h, onMounted, ref } from 'vue';

/**
 * Compatibility wrapper for wrapping an HTMLElement in a Vue component.
 *
 * @param {HTMLElement} element
 * @returns {import('vue').Component}
 */
export default function vueWrapHtmlElement(element) {
  return defineComponent({
    setup() {
      const wrapper = ref(null);

      onMounted(() => {
        if (wrapper.value) {
          wrapper.value.appendChild(element);
        }
      });

      // Render function returning the wrapper div
      // Use class 'u-contents' to set 'display: contents' of the parent div
      return () => h('div', { ref: wrapper, class: 'u-contents' });
    }
  });
}
