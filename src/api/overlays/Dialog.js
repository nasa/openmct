import DialogComponent from './components/DialogComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';

class Dialog extends Overlay {
    constructor({iconClass, message, title, hint, timestamp, ...options}) {

        let component = new Vue({
            provide: {
                iconClass,
                message,
                title,
                hint,
                timestamp
            },
            components: {
                DialogComponent: DialogComponent
            },
            template: '<dialog-component></dialog-component>'
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
}

export default Dialog;
