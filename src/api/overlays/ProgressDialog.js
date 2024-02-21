import mount from 'utils/mount';

import ProgressDialogComponent from './components/ProgressDialogComponent.vue';
import Overlay from './Overlay.js';

let component;
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
    const { vNode, destroy } = mount({
      components: {
        ProgressDialogComponent
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
          progressPerc,
          progressText
        };
      },
      template:
        '<progress-dialog-component :progress-perc="progressPerc" :progress-text="progressText"></progress-dialog-component>'
    });

    component = vNode.componentInstance;
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

  updateProgress(progressPerc, progressText) {
    component.$data.progressPerc = progressPerc;
    component.$data.progressText = progressText;
  }
}

export default ProgressDialog;
