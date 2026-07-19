import { createApp, defineComponent } from 'vue';

/**
 * @typedef {import('vue').Component} Component
 */

/**
 * Mounts a Vue component to a DOM element.
 * @param {Component | any} component
 * @param {Object} [options={}] the options object
 * @param {Object} [options.props] the props for the component
 * @param {Object} [options.children] the children for the component
 * @param {HTMLElement} [options.element] the element to mount the component to
 * @returns {Object}
 */
export default function mount(component, { props, children, element } = {}) {
  let el = element;
  if (!el) {
    el = document.createElement('div');
  }
  /** @type {Component | any} */
  let vueComponent = defineComponent(component);
  let app = createApp(vueComponent);
  let mountedComponentInstance = app.mount(el);

  // eslint-disable-next-line func-style
  const destroy = () => {
    app.unmount();
  };

  return {
    vNode: {
      componentInstance: mountedComponentInstance,
      el: mountedComponentInstance.$el
    },
    destroy,
    el
  };
}
