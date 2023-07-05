import ProgressDialogComponent from './components/ProgressDialogComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';


class ProgressDialog extends Overlay {
  constructor({
    progressPerc,
    progressText,
    iconClass,
    message,
    title,
    hint,
    timestamp,
    ...options
  }) {
    let element = document.createElement('div');
    document.body.appendChild(element);
    let app = null;
    let component = null;
    app = Vue.createApp({
      components: {
        ProgressDialogComponent: ProgressDialogComponent
      },
      provide: {
        iconClass,
        message,
        title,
        hint,
        timestamp
      },
      data() {
        return {
          model: {
            progressPerc: progressPerc || 0,
            progressText
          }
        };
      },
      template: '<progress-dialog-component :model="model"></progress-dialog-component>'
    });
    component = app.mount(element);

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

  updateProgress(progressPerc, progressText) {
    component.model.progressPerc = progressPerc;
    component.model.progressText = progressText;
  }
}

export default ProgressDialog;
