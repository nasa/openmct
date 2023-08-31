import DialogComponent from './components/DialogComponent.vue';
import Overlay from './Overlay';
import mount from 'utils/mount';

class Dialog extends Overlay {
  constructor({ iconClass, message, title, hint, timestamp, ...options }) {
    const { vNode, destroy } = mount({
      components: {
        DialogComponent: DialogComponent
      },
      provide: {
        iconClass,
        message,
        title,
        hint,
        timestamp
      },
      template: '<dialog-component></dialog-component>'
    });

    super({
      element: vNode.el,
      size: 'fit',
      dismissable: false,
      ...options
    });

    this.once('destroy', () => {
      destroy();
    });
  }
}

export default Dialog;
