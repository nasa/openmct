import { h, render } from 'vue';

export default function mount(component, { props, children, element, app } = {}) {
  let el = element;

  let vNode = h(component, props, children);
  if (app && app._context) {
    vNode.appContext = app._context;
  }
  if (el) {
    render(vNode, el);
  } else if (typeof document !== 'undefined') {
    render(vNode, (el = document.createElement('div')));
  }

  // eslint-disable-next-line func-style
  const destroy = () => {
    if (el) {
      render(null, el);
    }
    el = null;
    vNode = null;
  };

  return { vNode, destroy, el };
}
