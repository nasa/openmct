import ProgressDialogComponent from './components/ProgressDialogComponent.vue';
import Overlay from './Overlay';
import mount from 'utils/mount';

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
    component.model.progressPerc = progressPerc;
    component.model.progressText = progressText;
  }
}

export default ProgressDialog;
