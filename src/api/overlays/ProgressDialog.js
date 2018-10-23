import ProgressComponent from '../../ui/components/layout/ProgressBar.vue';
import Overlay from './Overlay';
import Vue from 'vue';

var component;

class ProgressDialog extends Overlay {
    constructor({progressPerc, progressText, ...options}) {

        component = new Vue({
            components: {
                ProgressComponent: ProgressComponent
            },
            data() {
                return {
                    model: {
                        progressPerc: progressPerc || 0,
                        progressText: progressText
                    }
                }
            },
            template: '<progress-component :model="model"></progress-component>'
        }).$mount();

        super({
            element: component.$el,
            size: 'fit',
            notDismissable: true,
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
