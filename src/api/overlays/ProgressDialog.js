import ProgressDialogComponent from './components/ProgressDialogComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';

let component;

class ProgressDialog extends Overlay {
    constructor({progressPerc, progressText, iconClass, message, title, hint, timestamp, ...options}) {
        component = new Vue({
            provide: {
                iconClass,
                message,
                title,
                hint,
                timestamp
            },
            components: {
                ProgressDialogComponent: ProgressDialogComponent
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
        }).$mount();

        super({
            element: component.$el,
            size: 'fit',
            dismissable: false,
            ...options
        });

        this.once('destroy', () => {
            component.$destroy();
        });
    }

    updateProgress(progressPerc, progressText) {
        component.model.progressPerc = progressPerc;
        component.model.progressText = progressText;
    }
}

export default ProgressDialog;
