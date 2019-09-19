import ProgressComponent from '../../ui/components/ProgressBar.vue';
import DialogComponent from './components/DialogComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';

var component;

class ProgressDialog extends Overlay {
    constructor({iconClass, message, title, hint, timestamp, progressPerc,  progressText, ...options}) {
        component = new Vue({
            provide: {
                iconClass,
                message,
                title,
                hint,
                timestamp
            },
            components: {
                DialogComponent: DialogComponent,
                ProgressComponent: ProgressComponent
            },
            data() {
                return {
                    model: {
                        progressPerc: progressPerc || 0,
                        progressText: progressText,
                    }
                }
            },
            template: '<dialog-component><progress-component :model="model"></progress-component></dialog-component>'
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
