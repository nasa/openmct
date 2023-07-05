import DialogComponent from './components/DialogComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';

class Dialog extends Overlay {
  constructor({ iconClass, message, title, hint, timestamp, ...options }) {
    let element = document.createElement('div');
    document.body.appendChild(element);
    let app = Vue.createApp({
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
    let component = app.mount(element);

    super({
      element: component.$el,
      size: 'fit',
      dismissable: false,
      ...options
    });

    this.once('destroy', () => {
      app.unmount();
      document.body.removeChild(element);
    });
  }
}

export default Dialog;
