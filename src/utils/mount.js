import { createApp, defineComponent } from 'vue';

export default function mount(component, { props, children, element } = {}) {
  let el = element;
  if (!el) {
    el = document.createElement('div');
  }
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
